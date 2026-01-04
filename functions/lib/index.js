"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBookingConfirmed = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.onBookingConfirmed = functions.firestore
    .document("bookings/{bookingId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const bookingId = context.params.bookingId;
    const wasConfirmed = before?.bookingStatus === "CONFIRMED";
    const isNowConfirmed = after?.bookingStatus === "CONFIRMED";
    if (wasConfirmed) {
        console.log(`[Trigger] Booking ${bookingId} already confirmed, skipping`);
        return null;
    }
    if (!isNowConfirmed) {
        console.log(`[Trigger] Booking ${bookingId} not confirmed, skipping`);
        return null;
    }
    if (after?.confirmationEmailSentAt) {
        console.log(`[Trigger] Email already sent for booking ${bookingId}`);
        return null;
    }
    console.log("[EMAIL] Sending confirmation email", {
        bookingId,
        email: after?.email,
    });
    try {
        const appUrl = process.env.APP_URL || "https://movigoo.in";
        const emailEndpoint = `${appUrl}/api/bookings/send-confirmation-email`;
        const response = await fetch(emailEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ bookingId }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Email API failed: ${response.status} ${errorText}`);
        }
        console.log(`[Trigger] Email sent successfully for booking ${bookingId}`);
        return null;
    }
    catch (error) {
        console.error(`[Trigger] Failed to send email for booking ${bookingId}:`, error);
        return null;
    }
});
//# sourceMappingURL=index.js.map