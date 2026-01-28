// app/shipping-return-policy/page.tsx
// Shipping and Return Policy page with improved readability and layout

"use client";

import LayoutWrapper from "@/components/LayoutWrapper";

export default function ShippingReturnPolicyPage() {
  return (
    <LayoutWrapper>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last updated: 28 January 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm sm:text-[15px] leading-relaxed text-slate-300">

          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Ticket Delivery Methods</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white mb-2">1.1 E-Tickets (Standard)</h3>
                <p className="mt-2">
                  Movigoo is a digital-first platform. Tickets are delivered electronically via email immediately after successful payment.
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
              <li><strong>Timing:</strong> typically within 5 minutes of purchase</li>
              <li><strong>Access:</strong> Tickets can also be accessed anytime in the &apos;My Bookings&apos; section of your account</li>
              <li><strong>Usage:</strong> E-tickets can be scanned directly from your mobile device at the venue entry</li>
            </ul>
          </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-2">1.2 Physical Tickets</h3>
                <p className="mt-2">
                  Physical shipping is generally not applicable unless explicitly stated for specific premium events. If applicable, tracking details will be provided via email.
                </p>
          </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Delivery Timeframes</h2>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Digital Tickets:</strong> Instant (0-10 minutes)</li>
              <li><strong>Failed Delivery:</strong> If you do not receive your email within 10 minutes, please check your Spam folder or check the &apos;My Bookings&apos; section on the website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Cancellations & Returns</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white mb-2">3.1 Event Cancellation by Organizer</h3>
                <p className="mt-2">
              If an event is cancelled by the organizer:
            </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
              <li>The Base Ticket Price will be refunded automatically</li>
              <li><strong>Note:</strong> Movigoo Platform Fees and Payment Gateway charges are strictly non-refundable, as these cover the cost of the transaction itself</li>
            </ul>
          </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-2">3.2 Customer-Requested Cancellation</h3>
                <ul className="mt-3 ml-6 list-disc space-y-2">
              <li>Requests must be made at least 48-72 hours before the event (subject to the specific Event Organizer&apos;s policy)</li>
              <li>If approved, a cancellation fee will apply</li>
              <li>Platform fees are non-refundable</li>
            </ul>
          </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-2">3.3 Non-Refundable Scenarios</h3>
                <ul className="mt-3 ml-6 list-disc space-y-2">
              <li>No-shows (failure to attend)</li>
              <li>Late arrival resulting in denied entry</li>
              <li>Lost or stolen digital access</li>
            </ul>
          </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Refund Processing</h2>
            <p>
          Approved refunds are credited back to the original payment source.
        </p>
        <ul className="ml-6 list-disc space-y-2 mt-3">
          <li><strong>UPI:</strong> 3-7 business days</li>
          <li><strong>Cards:</strong> 5-10 business days</li>
        </ul>
      </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Contact Information</h2>
            <p>
          For any issues regarding ticket delivery or non-receipt of booking confirmation, please contact us immediately:
        </p>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white"><strong>Movigoo Support</strong></p>
          <p className="mt-2 text-slate-300">
            Akshay Garden Apartment, I Block 102, Banashankari Badavane<br />
            Vidyanagar, Hubli
          </p>
          <p className="mt-3 text-slate-300">
            Email: <a href="mailto:movigootech@gmail.com" className="text-accent-amber hover:underline">movigootech@gmail.com</a>
          </p>
        </div>
      </section>
        </div>
      </main>
    </LayoutWrapper>
  );
}

