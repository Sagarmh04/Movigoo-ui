// app/refund-policy/page.tsx
// Refund Policy page with improved readability and layout

"use client";

import LayoutWrapper from "@/components/LayoutWrapper";

export default function RefundPolicyPage() {
  return (
    <LayoutWrapper>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Refund Policy
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last updated: 28 January 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm sm:text-[15px] leading-relaxed text-slate-300">
          <p>
            This Refund Policy outlines the terms and conditions under which refunds may be provided for tickets and 
            bookings made through Movigoo. Please read this policy carefully before making a purchase.
          </p>

          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
            <p className="font-semibold text-rose-200">Important Note:</p>
            <p className="mt-2 text-sm text-rose-100">
              Movigoo Platform Fees, Internet Handling Fees, and Payment Gateway Charges are strictly non-refundable under all circumstances, including event cancellations.
            </p>
          </div>


          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. General Refund Policy</h2>
            <p>
              Refund eligibility for tickets purchased through Movigoo depends on the type of event and the applicable refund policy. 
              Please read this policy carefully before making a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Eligible Refund Scenarios</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white mb-2">2.1 Event Cancellation</h3>
                <p className="mt-2">
              If an event is cancelled by the organizer:
            </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
              <li><strong>Refund Amount:</strong> 100% of the Base Ticket Price will be refunded</li>
              <li><strong>Non-Refundable Component:</strong> Platform fees, convenience fees, and internet handling charges are not refunded, as these cover the transaction costs already incurred</li>
              <li><strong>Processing Time:</strong> 7-14 business days</li>
              <li><strong>Notification:</strong> You will receive an email notification about the cancellation</li>
            </ul>
          </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-2">2.2 Event Postponement</h3>
                <p className="mt-2">
              If an event is postponed:
            </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
              <li>Your tickets remain valid for the new date</li>
              <li>If you cannot attend, refund requests must be submitted within 7 days of the announcement</li>
              <li>Approval is subject to the Event Organizer&apos;s discretion</li>
            </ul>
          </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-2">2.3 Customer-Requested Cancellations</h3>
                <p className="mt-2">
              If you wish to cancel your booking:
            </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
              <li><strong>Advance Notice:</strong> Request must be made at least 48-72 hours before the event</li>
              <li><strong>Approval:</strong> Strictly subject to the Organizer&apos;s specific policy. Many events have a &apos;No Cancellation&apos; policy</li>
              <li><strong>Deductions:</strong> If approved, a cancellation fee (typically 10-20%) plus the non-refundable platform fees will be deducted</li>
            </ul>
          </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Non-Refundable Scenarios</h2>
            <p>
          Refunds will NOT be provided for:
        </p>
            <ul className="ml-6 list-disc space-y-2">
          <li><strong>No-Show:</strong> Failure to attend the event</li>
          <li><strong>Late Requests:</strong> Requests made less than 48 hours before the event</li>
          <li><strong>Service Charges:</strong> Platform fees and gateway charges are never refunded</li>
          <li><strong>Lost Tickets:</strong> Lost or stolen digital ticket access</li>
          <li><strong>Event Completion:</strong> After the event has ended</li>
        </ul>
      </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Refund Processing Timeframes</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <ul className="space-y-2">
            <li><strong>UPI:</strong> 3-7 business days</li>
            <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
            <li><strong>Net Banking:</strong> 7-14 business days</li>
          </ul>
              <p className="mt-4 text-sm text-slate-400">
                <strong>Note:</strong> Timelines depend on your bank&apos;s processing speed.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. How to Request a Refund</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold text-white">Email Method:</p>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Send an email to <strong>movigootech@gmail.com</strong></li>
                <li><strong>Details Required:</strong> Booking ID, Event Name, and Reason for Request</li>
              </ul>
            </div>
      </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Refund Amount Calculation (Example)</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="font-semibold text-white">Event Cancellation:</p>
                <p className="mt-2">
                  (Ticket Price) - (Platform Fees) = Refund Amount
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="font-semibold text-white">Customer Cancellation:</p>
                <p className="mt-2">
                  (Ticket Price) - (Cancellation Charge) - (Platform Fees) = Refund Amount
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">7. Contact Information</h2>
            <p>
          For refund queries, contact us at:
        </p>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white"><strong>Movigoo</strong></p>
          <p className="mt-2 text-slate-300">
            Akshay Garden Apartment<br />
            I Block 102, Banashankari Badavane<br />
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

