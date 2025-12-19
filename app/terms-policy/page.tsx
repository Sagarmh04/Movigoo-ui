// app/terms-policy/page.tsx
// Terms & Conditions page with improved readability and layout

"use client";

import LayoutWrapper from "@/components/LayoutWrapper";

export default function TermsPolicyPage() {
  return (
    <LayoutWrapper>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Terms & Conditions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last updated: 19 December 2025
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-5 text-sm sm:text-[15px] leading-relaxed text-slate-300">
          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Movigoo website or mobile application (&quot;Platform&quot;), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              2. About Movigoo
            </h2>
            <p>
              Movigoo is an online event discovery and ticket booking platform. Movigoo acts solely as a technology platform that facilitates event listings and ticket bookings. Movigoo does not organize, manage, or control events unless explicitly stated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              3. User Eligibility
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You must be at least 18 years of age to use the Platform.</li>
              <li>You agree to provide accurate and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials and all activities performed under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              4. User Accounts & Authentication
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Access to certain features requires authentication via supported login methods.</li>
              <li>Movigoo reserves the right to suspend or terminate accounts found violating these Terms.</li>
              <li>Users are responsible for all activity occurring through their account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              5. Event Listings & Information
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Event details such as date, time, venue, pricing, and availability are provided by event organizers.</li>
              <li>Movigoo does not guarantee the accuracy or completeness of event information.</li>
              <li>Event schedules, pricing, or availability may change without prior notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              6. Ticket Booking
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Tickets are issued only after successful booking confirmation.</li>
              <li>Tickets are valid only for the specific event, date, and time mentioned.</li>
              <li>Tickets are non‑transferable, unless explicitly stated by the organizer.</li>
              <li>Users must verify booking details before confirming their purchase.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              7. Payments
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Payments are processed through third‑party payment gateways.</li>
              <li>Movigoo does not store sensitive payment information such as card or UPI details.</li>
              <li>Completion of payment does not guarantee entry if event rules or venue policies are violated.</li>
              <li>Payment gateway terms and conditions apply in addition to these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              8. Cancellations & Refunds
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Cancellation and refund policies are determined by the event organizer.</li>
              <li>Movigoo facilitates refunds strictly as per the applicable policy.</li>
              <li>Convenience fees or platform charges may be non‑refundable.</li>
              <li>Refund processing timelines depend on the payment gateway and banking partners.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              9. Event Entry & Ticket Usage
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Entry to events is subject to organizer rules and venue policies.</li>
              <li>Tickets or QR codes may be verified at the venue.</li>
              <li>Movigoo is not responsible for denied entry due to late arrival, invalid tickets, or organizer decisions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              10. Intellectual Property
            </h2>
            <p>
              All content on the Platform, including logos, design elements, text, graphics, and branding, is the property of Movigoo. Unauthorized use, reproduction, or distribution is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              11. Prohibited Activities
            </h2>
            <p className="mb-2">Users must not:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Attempt to hack, manipulate, or misuse the Platform</li>
              <li>Create fake or multiple accounts</li>
              <li>Circumvent payment or booking systems</li>
              <li>Upload misleading or harmful content</li>
            </ul>
            <p className="mt-2">
              Violation may result in account suspension or legal action.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              12. Limitation of Liability
            </h2>
            <p className="mb-2">Movigoo shall not be liable for:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Event cancellations, rescheduling, or changes</li>
              <li>Acts or omissions of event organizers or venues</li>
              <li>Technical issues beyond reasonable control</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
            <p className="mt-2">
              Use of the Platform is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              13. Privacy
            </h2>
            <p>
              Personal data is handled in accordance with the Privacy Policy. By using Movigoo, you consent to the collection and use of data as described therein.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              14. Modifications to Terms
            </h2>
            <p>
              Movigoo reserves the right to modify these Terms & Conditions at any time. Updates will be effective once published on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              15. Governing Law
            </h2>
            <p>
              These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the jurisdiction of Indian courts.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">
              16. Contact Information
            </h2>
            <p>
              For questions or support, contact:
            </p>
            <p className="mt-1">
              📧 support@movigoo.com
            </p>
          </section>
        </div>
      </main>
    </LayoutWrapper>
  );
}

