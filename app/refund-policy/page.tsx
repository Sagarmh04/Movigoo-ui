export const metadata = {
  title: "Refund Policy • Movigoo",
  description: "Movigoo Refund Policy - Guidelines for ticket refunds and cancellations"
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold text-white">Refund Policy</h1>
        <p className="text-sm text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className="text-lg text-slate-300">
          This Refund Policy outlines the terms and conditions under which refunds may be provided for tickets and 
          bookings made through Movigoo. Please read this policy carefully before making a purchase.
        </p>
      </div>

      <section className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Legal Business Information</h3>
          <div className="mt-3 space-y-2 text-sm text-white">
            <p><strong>Business Name:</strong> Movigoo</p>
            <p><strong>Registered Address:</strong><br />
              Akshay Garden Apartment<br />
              I Block 102, Banashankari Badavane<br />
              Vidyanagar, Hubli</p>
            <p><strong>Business Category:</strong> Event Ticketing and Booking Platform</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">1. General Refund Policy</h2>
        <p className="text-slate-300">
          Event tickets purchased through Movigoo are generally considered final sales and are non-refundable unless 
          otherwise stated in this policy or in the specific event terms. However, refunds may be available under 
          certain circumstances as outlined below.
        </p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="font-semibold text-white">Important Note:</p>
          <p className="mt-2 text-sm text-slate-300">
            Refund eligibility and processing are subject to the policies of individual event organizers. Movigoo 
            acts as an intermediary platform and processes refunds based on organizer policies and our terms of service.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">2. Eligible Refund Scenarios</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">2.1 Event Cancellation</h3>
            <p className="mt-2 text-slate-300">
              If an event is cancelled by the organizer or venue:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li><strong>Full Refund:</strong> 100% of the ticket price will be refunded</li>
              <li><strong>Processing Time:</strong> Refunds are processed within 7-14 business days</li>
              <li><strong>Payment Method:</strong> Refund will be credited to your original payment method</li>
              <li><strong>Notification:</strong> You will receive email notification about the cancellation and refund</li>
              <li><strong>Service Charges:</strong> Processing fees and service charges are also refunded in case of event cancellation</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">2.2 Event Postponement</h3>
            <p className="mt-2 text-slate-300">
              If an event is postponed to a different date:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Your tickets remain valid for the rescheduled date</li>
              <li>If you cannot attend the new date, refund requests may be considered</li>
              <li>Refund requests must be submitted within 7 days of the postponement announcement</li>
              <li>Refund eligibility is subject to organizer approval</li>
              <li>Processing time: 7-14 business days after approval</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">2.3 Event Venue Change (Significant)</h3>
            <p className="mt-2 text-slate-300">
              If an event is moved to a significantly different venue:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Refund requests will be considered on a case-by-case basis</li>
              <li>You may be offered tickets for the new venue or a full refund</li>
              <li>Refund requests must be made within 48 hours of the venue change notification</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">2.4 Customer-Requested Cancellations</h3>
            <p className="mt-2 text-slate-300">
              Customer-initiated cancellation requests are subject to the following:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li><strong>Advance Notice Required:</strong> Minimum 48-72 hours before the event (varies by event)</li>
              <li><strong>Cancellation Charges:</strong> May apply as per event organizer&apos;s policy (typically 10-20% of ticket value)</li>
              <li><strong>Service Charges:</strong> Processing fees and service charges are generally non-refundable</li>
              <li><strong>Approval Required:</strong> Subject to organizer approval and refund policy</li>
              <li><strong>Partial Refunds:</strong> May be provided after deducting cancellation charges</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">2.5 Duplicate Booking</h3>
            <p className="mt-2 text-slate-300">
              If you have accidentally made duplicate bookings:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Contact customer support immediately with booking details</li>
              <li>Refund may be provided for duplicate bookings if requested within 24 hours</li>
              <li>Refund subject to verification and organizer approval</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">2.6 Technical Errors</h3>
            <p className="mt-2 text-slate-300">
              In case of technical errors on our platform leading to incorrect charges:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Full refund will be provided for any incorrect charges</li>
              <li>Please report the issue immediately to customer support</li>
              <li>Refunds processed within 5-7 business days after verification</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">3. Non-Refundable Scenarios</h2>
        <p className="text-slate-300">
          Refunds will NOT be provided in the following situations:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li><strong>No-Show:</strong> Failure to attend the event on the scheduled date and time</li>
          <li><strong>Late Cancellation:</strong> Cancellation requests made less than 48 hours before the event (unless event-specific policy allows)</li>
          <li><strong>Change of Mind:</strong> Personal preferences or change of plans after purchase</li>
          <li><strong>Entry Denied:</strong> Due to violation of venue policies, inappropriate behavior, or invalid identification</li>
          <li><strong>Lost Tickets:</strong> Lost, stolen, or damaged tickets (unless reissue is possible)</li>
          <li><strong>Event Completion:</strong> After the event has taken place</li>
          <li><strong>Service Charges:</strong> Processing fees, convenience charges, and service charges are generally non-refundable (except in case of event cancellation)</li>
          <li><strong>Partial Attendance:</strong> Leaving the event early or missing part of the event</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">4. Refund Processing Timeframes</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="mb-3 text-slate-300">Refund processing times vary based on payment method:</p>
          <ul className="space-y-2 text-slate-300">
            <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
            <li><strong>UPI:</strong> 3-7 business days</li>
            <li><strong>Net Banking:</strong> 7-14 business days</li>
            <li><strong>Digital Wallets:</strong> 3-7 business days</li>
            <li><strong>Bank Transfers:</strong> 7-14 business days</li>
          </ul>
          <p className="mt-4 text-sm text-slate-400">
            <strong>Note:</strong> Actual refund credit to your account may take additional time depending on your bank 
            or payment provider&apos;s processing times. All refunds are processed to the original payment method used for the purchase.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">5. How to Request a Refund</h2>
        <p className="text-slate-300">
          To request a refund, please follow these steps:
        </p>
        <ol className="ml-6 list-decimal space-y-3 text-slate-300">
          <li>
            <strong>Online Method:</strong>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Log into your Movigoo account</li>
              <li>Navigate to &quot;My Bookings&quot; section</li>
              <li>Select the booking you wish to cancel</li>
              <li>Click on &quot;Request Refund&quot; or &quot;Cancel Booking&quot; option</li>
              <li>Provide the reason for cancellation</li>
              <li>Submit your request</li>
            </ul>
          </li>
          <li>
            <strong>Email Method:</strong>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Send an email to support@movigoo.com</li>
              <li>Include your booking reference number</li>
              <li>Mention the reason for refund request</li>
              <li>Provide your contact details</li>
            </ul>
          </li>
          <li>
            <strong>Customer Support:</strong>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Contact our customer support team</li>
              <li>Have your booking details ready</li>
              <li>Our team will guide you through the refund process</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">6. Refund Amount Calculation</h2>
        <p className="text-slate-300">
          The refund amount is calculated as follows:
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="font-semibold text-white">Event Cancellation (Full Refund):</p>
            <p className="mt-2 text-slate-300">
              Ticket Price + Processing Fees + Service Charges = Full Refund
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="font-semibold text-white">Customer-Requested Cancellation (Partial Refund):</p>
            <p className="mt-2 text-slate-300">
              Ticket Price - Cancellation Charges - Service Charges = Refund Amount
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Cancellation charges typically range from 10% to 20% of the ticket price, as per event organizer&apos;s policy.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">7. Refund Confirmation and Tracking</h2>
        <p className="text-slate-300">
          Once your refund is approved and processed:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>You will receive an email confirmation with refund details</li>
          <li>Refund status can be tracked in your Movigoo account under &quot;My Bookings&quot;</li>
          <li>You will receive an SMS notification when the refund is initiated</li>
          <li>Refund will appear in your account statement within the stated timeframes</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">8. Disputed Refunds</h2>
        <p className="text-slate-300">
          If you believe a refund should have been processed but hasn&apos;t been, or if you disagree with a refund decision:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>Contact our customer support team within 30 days of the event date</li>
          <li>Provide all relevant booking details and documentation</li>
          <li>Our team will review your case and respond within 5-7 business days</li>
          <li>If the dispute is valid, the refund will be processed immediately</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">9. Event-Specific Refund Policies</h2>
        <p className="text-slate-300">
          Please note that individual events may have specific refund policies that differ from our general policy. 
          These will be clearly stated:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>During the booking process (before payment confirmation)</li>
          <li>In your booking confirmation email</li>
          <li>On the event detail page</li>
        </ul>
        <p className="mt-3 text-slate-300">
          Event-specific policies take precedence over our general refund policy. We recommend reviewing these terms 
          carefully before completing your purchase.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">10. Contact for Refund Queries</h2>
        <p className="text-slate-300">
          For any questions, concerns, or assistance regarding refunds, please contact us:
        </p>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white"><strong>Customer Support - Refund Department</strong></p>
          <p className="mt-2 text-slate-300">
            Movigoo<br />
            Akshay Garden Apartment<br />
            I Block 102, Banashankari Badavane<br />
            Vidyanagar, Hubli
          </p>
          <p className="mt-3 text-slate-300">
            Email: <a href="mailto:refunds@movigoo.com" className="text-accent-amber hover:underline">refunds@movigoo.com</a>
          </p>
          <p className="mt-2 text-slate-300">
            General Support: <a href="mailto:support@movigoo.com" className="text-accent-amber hover:underline">support@movigoo.com</a>
          </p>
          <p className="mt-2 text-slate-300">
            Support Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-400">
          By purchasing tickets through Movigoo, you acknowledge that you have read, understood, and agree to this 
          Refund Policy. This policy is subject to change without prior notice, and any updates will be reflected on 
          this page. We recommend reviewing this policy periodically for any changes.
        </p>
      </section>
    </div>
  );
}

