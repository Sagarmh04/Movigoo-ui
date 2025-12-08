// hooks/useHostedEvents.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp,
  getDocs,
  collectionGroup,
  Firestore
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Event } from "@/types/event";

type HostedEventItem = {
  id: string;
  title: string;
  description?: string;
  startAt?: Date | null;
  endAt?: Date | null;
  image?: string | null;
  host?: string | null;
  status?: string | null;
  isHosted?: boolean | null;
  hosted?: boolean | null;
  published?: boolean | null;
  visibility?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  seatsTotal?: number | null;
  seatsBooked?: number | null;
  bookingEnabled?: boolean | null;
  bookingUrl?: string | null;
  city?: string;
  venue?: string;
  categories?: string[];
  priceFrom?: number;
  organizerId?: string;
  slug?: string;
  coverWide?: string;
  coverPortrait?: string[];
  rating?: number;
  raw?: DocumentData;
};

type DebugInfo = {
  counts: Record<string, number>;
  lastUpdated: string | null;
  lastSeenDocIds: string[];
  fallbackUsed: boolean;
  fallbackDocs: string[];
  notes?: string[];
};

const HOSTED_STATUSES = ["hosted", "published", "live"];

const isDev = process.env.NODE_ENV !== "production";

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value?.toDate === "function") return value.toDate();
  return null;
};

const isHostedFlag = (data: DocumentData): boolean => {
  const status = (data.status || data.visibility || "").toString().toLowerCase();
  return (
    HOSTED_STATUSES.includes(status) ||
    data.isHosted === true ||
    data.hosted === true ||
    data.published === true ||
    (typeof data.visibility === "string" && data.visibility.toLowerCase() === "hosted")
  );
};

const mapToHostedEvent = (docId: string, data: DocumentData): HostedEventItem => {
  return {
    id: docId,
    title: data.title || "Untitled",
    description: data.description || "",
    startAt: toDate(data.startAt),
    endAt: toDate(data.endAt),
    image: data.image || data.coverWide || data.coverPortrait?.[0] || null,
    host: data.host || data.organizer || null,
    status: data.status || null,
    isHosted: data.isHosted ?? null,
    hosted: data.hosted ?? null,
    published: data.published ?? null,
    visibility: data.visibility ?? null,
    createdAt: toDate(data.createdAt) || toDate(data.created_at),
    updatedAt: toDate(data.updatedAt) || toDate(data.updated_at),
    seatsTotal: typeof data.seatsTotal === "number" ? data.seatsTotal : null,
    seatsBooked: typeof data.seatsBooked === "number" ? data.seatsBooked : null,
    bookingEnabled: typeof data.bookingEnabled === "boolean" ? data.bookingEnabled : null,
    bookingUrl: typeof data.bookingUrl === "string" ? data.bookingUrl : null,
    city: data.city || "TBA",
    venue: data.venue || "TBA",
    categories: Array.isArray(data.categories) ? data.categories : [],
    priceFrom: typeof data.priceFrom === "number" ? data.priceFrom : 0,
    organizerId: data.organizerId || data.hostId || data.organizer || "",
    slug: data.slug || "",
    coverWide: data.coverWide,
    coverPortrait: data.coverPortrait,
    rating: typeof data.rating === "number" ? data.rating : undefined,
    raw: data
  };
};

const toEvent = (item: HostedEventItem): Event => {
  const slug =
    item.slug ||
    item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return {
    id: item.id,
    slug,
    title: item.title || "Untitled Event",
    coverWide: item.coverWide || item.image || "/placeholder-event.jpg",
    coverPortrait: item.coverPortrait || [item.image || "/placeholder-event.jpg"],
    city: item.city || "TBA",
    venue: item.venue || "TBA",
    dateStart: (item.startAt ?? new Date()).toISOString(),
    dateEnd: item.endAt ? item.endAt.toISOString() : undefined,
    categories: item.categories || [],
    rating: item.rating,
    priceFrom: item.priceFrom ?? 0,
    description: item.description || "",
    organizerId: item.organizerId || item.host || "",
    hosted: true
  };
};

/**
 * Hook to fetch only hosted events with aggressive fallback strategies and debug info.
 *
 * Causes that typically block data:
 * - Wrong collection path (events stored under subcollections)
 * - Field name mismatch (status vs isHosted vs hosted vs published)
 * - Firestore security rules denying read
 * - Missing indexes for "in" queries
 */
export function useHostedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugInfo>({
    counts: {},
    lastUpdated: null,
    lastSeenDocIds: [],
    fallbackUsed: false,
    fallbackDocs: [],
    notes: []
  });

  const mapRef = useRef<Map<string, HostedEventItem>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!db) {
      setError("Firebase not initialized. Please check NEXT_PUBLIC_FIREBASE_* vars.");
      setLoading(false);
      return;
    }
    const firestore = db as Firestore;

    const disposers: Array<() => void> = [];
    const localDebug: DebugInfo = {
      counts: {},
      lastUpdated: null,
      lastSeenDocIds: [],
      fallbackUsed: false,
      fallbackDocs: [],
      notes: []
    };

    const hostedQueries: { key: string; build: () => any }[] = [
      {
        key: "status_in",
        build: () => query(collection(firestore, "events"), where("status", "in", HOSTED_STATUSES))
      },
      { key: "isHosted_true", build: () => query(collection(firestore, "events"), where("isHosted", "==", true)) },
      { key: "hosted_true", build: () => query(collection(firestore, "events"), where("hosted", "==", true)) },
      { key: "published_true", build: () => query(collection(firestore, "events"), where("published", "==", true)) },
      { key: "visibility_hosted", build: () => query(collection(firestore, "events"), where("visibility", "==", "hosted")) }
    ];

    const mergeDoc = (item: HostedEventItem, source: string) => {
      const existing = mapRef.current.get(item.id);
      if (!existing) {
        mapRef.current.set(item.id, item);
        return;
      }

      // Prefer doc with startAt/createdAt and latest updatedAt
      const updatedExisting = existing.updatedAt?.getTime() ?? -1;
      const updatedIncoming = item.updatedAt?.getTime() ?? -1;
      const incomingHasDate = Boolean(item.startAt || item.createdAt);
      const existingHasDate = Boolean(existing.startAt || existing.createdAt);

      const shouldReplace =
        (incomingHasDate && !existingHasDate) ||
        updatedIncoming > updatedExisting ||
        (!existingHasDate && !incomingHasDate);

      if (shouldReplace) {
        mapRef.current.set(item.id, { ...existing, ...item });
      }
    };

    const emit = (label: string) => {
      const list = Array.from(mapRef.current.values());
      // Sort: startAt asc, then createdAt desc (newest first)
      list.sort((a, b) => {
        if (a.startAt && b.startAt) return a.startAt.getTime() - b.startAt.getTime();
        if (a.startAt) return -1;
        if (b.startAt) return 1;
        const aCreated = a.createdAt?.getTime() ?? 0;
        const bCreated = b.createdAt?.getTime() ?? 0;
        return bCreated - aCreated;
      });

      const mapped = list.map(toEvent);
      setEvents(mapped);
      setLoading(false);

      const ids = list.slice(0, 5).map((d) => d.id);
      setDebug((prev) => ({
        ...prev,
        counts: { ...prev.counts, ...localDebug.counts },
        lastUpdated: new Date().toISOString(),
        lastSeenDocIds: ids,
        fallbackUsed: prev.fallbackUsed || localDebug.fallbackUsed,
        fallbackDocs: prev.fallbackDocs.length ? prev.fallbackDocs : localDebug.fallbackDocs,
        notes: Array.from(new Set([...(prev.notes ?? []), ...(localDebug.notes ?? [])]))
      }));

      if (isDev) {
        // eslint-disable-next-line no-console
        console.debug(`[useHostedEvents] ${label}`, {
          total: list.length,
          sample: list.slice(0, 3).map((d) => ({
            id: d.id,
            status: d.status,
            isHosted: d.isHosted,
            hosted: d.hosted,
            published: d.published,
            visibility: d.visibility,
            startAt: d.startAt,
            createdAt: d.createdAt
          }))
        });
      }
    };

    const attachListener = (key: string, qBuilder: () => any) => {
      try {
        const q = qBuilder();
        const unsub = onSnapshot(
          q,
          (snap: QuerySnapshot<DocumentData>) => {
            localDebug.counts[key] = snap.docs.length;
            snap.docs.forEach((doc) => mergeDoc(mapToHostedEvent(doc.id, doc.data()), key));
            emit(key);
          },
          (err) => {
            localDebug.notes?.push(`Query ${key} failed: ${err?.message ?? err}`);
            if (isDev) {
              // eslint-disable-next-line no-console
              console.warn(`[useHostedEvents] listener error (${key})`, err);
            }
          }
        );
        disposers.push(unsub);
      } catch (err: any) {
        localDebug.notes?.push(`Query ${key} setup failed: ${err?.message ?? err}`);
        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn(`[useHostedEvents] failed to attach listener (${key})`, err);
        }
      }
    };

    hostedQueries.forEach((q) => attachListener(q.key, q.build));

    // Fallback: one-time fetch from /events
    const runFallbackFetch = async () => {
      try {
        const snap = await getDocs(collection(firestore, "events"));
        const found: string[] = [];
        snap.docs.forEach((doc) => {
          const data = doc.data();
          if (isHostedFlag(data)) {
            const item = mapToHostedEvent(doc.id, data);
            mergeDoc(item, "fallback_getDocs");
            found.push(doc.id);
          }
        });
        if (found.length) {
          localDebug.fallbackUsed = true;
          localDebug.fallbackDocs = found;
          emit("fallback_getDocs");
        }
      } catch (err: any) {
        localDebug.notes?.push(`fallback getDocs failed: ${err?.message ?? err}`);
        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn("[useHostedEvents] fallback getDocs error", err);
        }
      }
    };

    // Fallback: collectionGroup listener to catch nested events
    const attachCollectionGroup = () => {
      try {
        const unsub = onSnapshot(
          collectionGroup(firestore, "events"),
          (snap) => {
            localDebug.counts.collectionGroup = snap.docs.length;
            snap.docs.forEach((doc) => {
              const data = doc.data();
              if (isHostedFlag(data)) {
                mergeDoc(mapToHostedEvent(doc.id, data), "collectionGroup");
              }
            });
            emit("collectionGroup");
          },
          (err) => {
            localDebug.notes?.push(`collectionGroup failed: ${err?.message ?? err}`);
            if (isDev) {
              // eslint-disable-next-line no-console
              console.warn("[useHostedEvents] collectionGroup error", err);
            }
          }
        );
        disposers.push(unsub);
      } catch (err: any) {
        localDebug.notes?.push(`collectionGroup setup failed: ${err?.message ?? err}`);
        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn("[useHostedEvents] collectionGroup setup error", err);
        }
      }
    };

    attachCollectionGroup();
    runFallbackFetch();

    // If nothing received after 5s but fallback had docs, use fallback
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!mapRef.current.size && localDebug.fallbackDocs.length) {
        emit("fallback_timeout");
      }
    }, 5000);

    return () => {
      disposers.forEach((fn) => fn());
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const result = useMemo(
    () => ({
      events,
      loading,
      error,
      debug
    }),
    [events, loading, error, debug]
  );

  return result;
}

