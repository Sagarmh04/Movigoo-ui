export const metadata = {
  title: "Shipping and Return Policy • Movigoo",
  description: "Movigoo Shipping and Return Policy for event tickets and bookings"
};

export default function ShippingReturnPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold text-white">Shipping and Return Policy</h1>
        <p className="text-sm text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className="text-lg text-slate-300">
          This policy outlines our procedures for ticket delivery, returns, and cancellations for events booked through Movigoo.
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
        <h2 className="text-2xl font-semibold text-white">1. Ticket Delivery Methods</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">1.1 E-Tickets (Electronic Tickets)</h3>
            <p className="mt-2 text-slate-300">
              Most tickets are delivered electronically via email immediately after successful payment confirmation. 
              E-tickets will be sent to the email address associated with your Movigoo account.
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>E-tickets are typically delivered within minutes of purchase</li>
              <li>You will receive a confirmation email with your ticket(s)</li>
              <li>Tickets can be accessed through your Movigoo account under "My Bookings"</li>
              <li>E-tickets can be scanned directly from your mobile device at the venue</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">1.2 Physical Tickets (If Applicable)</h3>
            <p className="mt-2 text-slate-300">
              In cases where physical tickets are required, we use reliable courier services for delivery. 
              Physical tickets are typically shipped within 2-5 business days after booking confirmation.
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Shipping charges (if any) will be clearly displayed during checkout</li>
              <li>Delivery times may vary based on your location</li>
              <li>You will receive tracking information via email once the ticket is shipped</li>
              <li>Please ensure your delivery address is correct and complete</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">1.3 Will-Call/Pickup at Venue</h3>
            <p className="mt-2 text-slate-300">
              Some events may offer will-call or venue pickup options. In such cases:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>You will be notified about the pickup location and timings</li>
              <li>Valid government-issued photo ID is required for ticket collection</li>
              <li>The booking confirmation email must be presented at the venue</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">2. Delivery Timeframes</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <ul className="space-y-3 text-slate-300">
            <li><strong>E-Tickets:</strong> Instant delivery via email (typically within 5-10 minutes of payment)</li>
            <li><strong>Physical Tickets:</strong> 2-5 business days for standard shipping, 1-2 business days for express shipping (if available)</li>
            <li><strong>Last-Minute Bookings:</strong> For bookings made within 24 hours of the event, only e-tickets or venue pickup may be available</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">3. Ticket Delivery Issues</h2>
        <p className="text-slate-300">
          If you do not receive your ticket(s) within the expected timeframe, please:
        </p>
        <ol className="ml-6 list-decimal space-y-2 text-slate-300">
          <li>Check your spam/junk folder for the confirmation email</li>
          <li>Log into your Movigoo account and check "My Bookings" section</li>
          <li>Verify that the email address associated with your account is correct</li>
          <li>Contact our customer support team immediately with your booking reference number</li>
        </ol>
        <p className="mt-3 text-slate-300">
          We will investigate and ensure you receive your tickets before the event date. In case of any delivery issues, 
          alternative arrangements will be made to ensure you can attend the event.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">4. Return and Cancellation Policy</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">4.1 General Policy</h3>
            <p className="mt-2 text-slate-300">
              Event tickets are generally non-refundable and non-transferable unless otherwise stated. However, 
              certain circumstances may allow for cancellations or returns:
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">4.2 Event Cancellation by Organizer</h3>
            <p className="mt-2 text-slate-300">
              If an event is cancelled by the organizer or venue:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Full refund will be processed automatically to your original payment method</li>
              <li>Refund processing typically takes 7-14 business days</li>
              <li>You will be notified via email about the cancellation and refund process</li>
              <li>No cancellation charges will apply</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">4.3 Event Postponement</h3>
            <p className="mt-2 text-slate-300">
              If an event is postponed:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Your tickets will remain valid for the rescheduled date</li>
              <li>If you cannot attend the rescheduled date, refund requests may be considered</li>
              <li>Refund requests must be submitted within 7 days of the postponement announcement</li>
              <li>Refunds (if approved) will be processed within 7-14 business days</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">4.4 Customer-Requested Cancellations</h3>
            <p className="mt-2 text-slate-300">
              Cancellation requests by customers are subject to the following conditions:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Cancellation requests must be made at least 48-72 hours before the event (timeframe varies by event)</li>
              <li>Cancellation charges may apply as per the event organizer's policy</li>
              <li>Refunds (if approved) will be processed to the original payment method</li>
              <li>Processing fees and service charges are generally non-refundable</li>
              <li>Refund eligibility is subject to approval by the event organizer</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">4.5 Non-Refundable Situations</h3>
            <p className="mt-2 text-slate-300">
              Tickets are typically non-refundable in the following cases:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>No-show on the event date</li>
              <li>Cancellation requests made less than 48 hours before the event</li>
              <li>Change of mind or personal circumstances (unless covered by specific event terms)</li>
              <li>Late arrival or entry denied due to venue policies</li>
              <li>Lost or stolen tickets (we recommend keeping your tickets secure)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">5. Ticket Transfer and Resale</h2>
        <p className="text-slate-300">
          Most tickets are non-transferable and tied to the original purchaser. However:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>Some events may allow ticket transfers - check event-specific terms</li>
          <li>If transfer is allowed, it must be done through your Movigoo account</li>
          <li>Transfers may be subject to fees</li>
          <li>Unauthorized resale of tickets may result in ticket cancellation</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">6. Refund Processing</h2>
        <p className="text-slate-300">
          When a refund is approved:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>Refunds will be processed to the original payment method used for purchase</li>
          <li>Processing time: 7-14 business days (may vary by payment method and bank)</li>
          <li>Credit card refunds: 5-10 business days</li>
          <li>UPI refunds: 3-7 business days</li>
          <li>Net banking refunds: 7-14 business days</li>
          <li>You will receive email confirmation once the refund is initiated</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">7. Return Request Procedure</h2>
        <p className="text-slate-300">
          To request a return or cancellation:
        </p>
        <ol className="ml-6 list-decimal space-y-2 text-slate-300">
          <li>Log into your Movigoo account</li>
          <li>Navigate to "My Bookings" section</li>
          <li>Select the booking you wish to cancel</li>
          <li>Click on "Request Cancellation" (if available for your booking)</li>
          <li>Provide a reason for cancellation</li>
          <li>Submit the request</li>
          <li>Alternatively, contact our customer support team with your booking reference number</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">8. Damaged or Lost Tickets</h2>
        <p className="text-slate-300">
          In case of damaged or lost tickets:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>Contact customer support immediately with your booking details</li>
          <li>We may be able to reissue tickets (subject to venue/organizer policies)</li>
          <li>Valid identification and proof of purchase may be required</li>
          <li>Reissue fees may apply</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">9. Event-Specific Policies</h2>
        <p className="text-slate-300">
          Please note that specific events may have their own cancellation and refund policies that override our 
          general policy. These will be clearly stated during the booking process and in your confirmation email. 
          We recommend reviewing event-specific terms before completing your purchase.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">10. Contact for Shipping and Returns</h2>
        <p className="text-slate-300">
          For any queries regarding shipping, delivery, returns, or cancellations, please contact our customer support:
        </p>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white"><strong>Customer Support</strong></p>
          <p className="mt-2 text-slate-300">
            Movigoo<br />
            Akshay Garden Apartment<br />
            I Block 102, Banashankari Badavane<br />
            Vidyanagar, Hubli
          </p>
          <p className="mt-3 text-slate-300">
            Email: <a href="mailto:support@movigoo.com" className="text-accent-amber hover:underline">support@movigoo.com</a>
          </p>
          <p className="mt-2 text-slate-300">
            Support Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-400">
          By making a booking through Movigoo, you acknowledge that you have read, understood, and agree to this 
          Shipping and Return Policy. This policy is subject to change, and any updates will be reflected on this page.
        </p>
      </section>
    </div>
  );
}

