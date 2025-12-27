import crypto from "crypto";
import {
  Firestore,
  Timestamp,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { sendTicketEmail } from "@/lib/sendTicketEmail";

function safeUpper(val: unknown) {
  return typeof val === "string" ? val.toUpperCase() : "";
}

function getLockAgeMs(lockedAt: unknown): number | null {
  if (!lockedAt) return null;
  if (lockedAt instanceof Timestamp) return Date.now() - lockedAt.toMillis();
  if (typeof lockedAt === "object" && lockedAt && typeof (lockedAt as any).toMillis === "function") {
    return Date.now() - (lockedAt as any).toMillis();
  }
  return null;
}

export async function maybeSendBookingConfirmationEmail(args: {
  firestore: Firestore;
  bookingId: string;
  eventId?: string | null;
}) {
  const { firestore, bookingId, eventId } = args;

  const bookingRef = doc(firestore, "bookings", bookingId);
  const lockId = crypto.randomUUID();

  const lock = await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(bookingRef);
    if (!snap.exists()) return { shouldSend: false as const };

    const data = snap.data() as any;

    const alreadyConfirmed =
      safeUpper(data.bookingStatus) === "CONFIRMED" && safeUpper(data.paymentStatus) === "SUCCESS";
    if (!alreadyConfirmed) return { shouldSend: false as const };

    if (data.confirmationEmailSentAt) return { shouldSend: false as const };

    const existingLockId = data.confirmationEmailSendLockId as string | undefined;
    const lockAgeMs = getLockAgeMs(data.confirmationEmailSendLockedAt);
    if (existingLockId && lockAgeMs !== null && lockAgeMs < 10 * 60 * 1000) {
      return { shouldSend: false as const };
    }

    tx.set(
      bookingRef,
      {
        confirmationEmailSendLockId: lockId,
        confirmationEmailSendLockedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { shouldSend: true as const, data, lockId };
  });

  if (!lock.shouldSend) return;

  const data = lock.data as any;

  const userEmail = data.userEmail || data.email || null;
  if (!userEmail) {
    await setDoc(
      bookingRef,
      {
        confirmationEmailSendLockId: null,
        confirmationEmailLastError: "Missing user email",
      },
      { merge: true }
    );
    return;
  }

  const userName = data.userName || data.name || "Guest User";
  const eventDateRaw = data.date || data.eventDate || new Date().toISOString().split("T")[0];

  let formattedEventDate: string;
  try {
    const d = new Date(eventDateRaw);
    formattedEventDate = !isNaN(d.getTime())
      ? d.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : String(eventDateRaw);
  } catch {
    formattedEventDate = String(eventDateRaw);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
  const ticketLink = `${appUrl}/my-bookings?bookingId=${bookingId}`;

  const showTime = data.showTime || data.time || null;
  const showEndTime = data.showEndTime || null;
  const eventTime = showTime ? (showEndTime ? `${showTime} - ${showEndTime}` : showTime) : undefined;

  const venueName = data.venueName || data.venue || "TBA";
  const venueAddress = data.venueAddress || null;
  const venueDisplay = venueAddress ? `${venueName}, ${venueAddress}` : venueName;

  try {
    await sendTicketEmail({
      to: userEmail,
      name: userName,
      eventName: data.eventTitle || "Event",
      eventDate: formattedEventDate,
      eventTime,
      venue: venueDisplay,
      ticketQty: data.quantity || 1,
      bookingId,
      ticketLink,
    });

    const sentUpdate = {
      confirmationEmailSentAt: serverTimestamp(),
      confirmationEmailSendLockId: null,
      confirmationEmailLastError: null,
    };

    await Promise.all([
      setDoc(bookingRef, sentUpdate, { merge: true }),
      eventId
        ? setDoc(doc(firestore, "events", eventId, "bookings", bookingId), sentUpdate, { merge: true })
        : Promise.resolve(),
    ]);
  } catch (err: any) {
    const errorUpdate = {
      confirmationEmailSendLockId: null,
      confirmationEmailLastError: err?.message || "Email send failed",
    };

    await Promise.all([
      setDoc(bookingRef, errorUpdate, { merge: true }),
      eventId
        ? setDoc(doc(firestore, "events", eventId, "bookings", bookingId), errorUpdate, { merge: true })
        : Promise.resolve(),
    ]);
  }
}
