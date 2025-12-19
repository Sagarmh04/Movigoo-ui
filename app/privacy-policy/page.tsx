// app/privacy-policy/page.tsx
// Privacy Policy page with improved readability and layout

"use client";

import LayoutWrapper from "@/components/LayoutWrapper";

export default function PrivacyPolicyPage() {
  return (
    <LayoutWrapper>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last updated: 19 December 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm sm:text-[15px] leading-relaxed text-slate-300">
          <p>
            At Movigoo, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
            platform and services.
          </p>

          <section>
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

          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Information We Collect</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white mb-2">1.1 Personal Information</h3>
                <p className="mt-2">
                  When you register for an account, make a booking, or interact with our services, we may collect the following information:
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
                  <li>Name, email address, phone number</li>
                  <li>Date of birth and age verification details</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely through third-party payment gateways)</li>
                  <li>Government-issued identification (only when required for specific events or venue entry, if applicable)</li>
                  <li>Profile picture and preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-2">1.2 Transaction Information</h3>
                <p className="mt-2">
                  We collect information about your transactions, including:
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
                  <li>Booking history and ticket purchases</li>
                  <li>Payment method and transaction details</li>
                  <li>Event preferences and search history</li>
                  <li>Attendee information for group bookings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-2">1.3 Technical Information</h3>
                <p className="mt-2">
                  When you visit our website or use our mobile application, we automatically collect:
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
                  <li>IP address and device identifiers</li>
                  <li>Browser type and version</li>
                  <li>Operating system information</li>
                  <li>Pages visited, time spent, and navigation patterns</li>
                  <li>Referring website addresses</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. How We Use Your Information</h2>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Service Delivery:</strong> To process your bookings, process payments, and deliver tickets</li>
              <li><strong>Account Management:</strong> To create and manage your account, authenticate users, and provide customer support</li>
              <li><strong>Communication:</strong> To send booking confirmations, event updates, promotional offers, and important service notifications</li>
              <li><strong>Personalization:</strong> To customize your experience, recommend events, and improve our services</li>
              <li><strong>Payment Processing:</strong> To securely process payments through authorized payment gateways (such as PayU, Razorpay, etc.)</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations, prevent fraud, and ensure security</li>
              <li><strong>Analytics:</strong> To analyze usage patterns, improve our platform, and develop new features</li>
              <li><strong>Marketing:</strong> To send promotional communications (with your consent) about events and special offers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Payment Information and Third-Party Payment Processors</h2>
            <p>
              Movigoo uses trusted third-party payment processors to handle all payment transactions securely. We do not store 
              your complete credit card or debit card details on our servers. Payment information is processed directly by 
              our payment partners, including but not limited to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>PayU India Private Limited</li>
              <li>Razorpay Software Private Limited</li>
              <li>Other authorized payment gateway providers</li>
            </ul>
            <p className="mt-3">
              These payment processors are PCI-DSS compliant and use industry-standard encryption to protect your financial 
              information. By using our services, you agree to the privacy policies and terms of service of these payment 
              processors. We may receive transaction status and limited payment information necessary to complete your booking.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies, web beacons, and similar tracking technologies to enhance your experience on our platform:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Essential Cookies:</strong> Required for basic platform functionality, authentication, and security</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
            </ul>
            <p className="mt-3">
              You can control cookie preferences through your browser settings. However, disabling certain cookies may 
              affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Information Sharing and Disclosure</h2>
            <p>
              We may share your information in the following circumstances:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Event Organizers:</strong> We share necessary booking and attendee information with event organizers to facilitate event entry and management</li>
              <li><strong>Service Providers:</strong> We share information with trusted third-party service providers who assist us in operations, payment processing, analytics, and customer support</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets, your information may be transferred</li>
              <li><strong>With Your Consent:</strong> We may share information when you explicitly consent to such sharing</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure server infrastructure and access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection</li>
              <li>Compliance with applicable data protection regulations</li>
            </ul>
            <p className="mt-3">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">7. Your Rights and Choices</h2>
            <p>
              You have the following rights regarding your personal information:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Access:</strong> Request access to your personal information we hold</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal and contractual obligations)</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a structured format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Account Deletion:</strong> Request account closure and data deletion</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us through the contact information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">8. Children&apos;s Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
              information from children. If you believe we have inadvertently collected information from a minor, please 
              contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than India, including countries 
              with different data protection laws. We ensure appropriate safeguards are in place to protect your information 
              in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">10. Retention of Information</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy 
              Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Transaction records and 
              booking information may be retained for a longer period as required by law or for business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of significant changes by posting the updated policy on our website and updating the 
              &quot;Last updated&quot; date. Your continued use of our services after changes are made constitutes acceptance of 
              the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">12. Grievance Officer</h2>
            <p>
              In accordance with Indian data protection laws, if you have any complaints, grievances, or concerns regarding 
              the processing of your personal information, you may contact our Grievance Officer:
            </p>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-white"><strong>Grievance Officer</strong></p>
              <p className="mt-2 text-slate-300">
                Movigoo<br />
                Akshay Garden Apartment<br />
                I Block 102, Banashankari Badavane<br />
                Vidyanagar, Hubli
              </p>
              <p className="mt-3">
                Email: <a href="mailto:privacy@movigoo.in" className="text-accent-amber hover:underline">privacy@movigoo.in</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-white"><strong>Movigoo</strong></p>
              <p className="mt-2 text-slate-300">
                Akshay Garden Apartment<br />
                I Block 102, Banashankari Badavane<br />
                Vidyanagar, Hubli
              </p>
              <p className="mt-3">
                Email: <a href="mailto:privacy@movigoo.in" className="text-accent-amber hover:underline">privacy@movigoo.in</a>
              </p>
            </div>
          </section>

          <section>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-slate-400">
                By using Movigoo&apos;s services, you acknowledge that you have read, understood, and agree to this Privacy Policy. 
                If you do not agree with any part of this policy, please discontinue use of our services.
              </p>
            </div>
          </section>
        </div>
      </main>
    </LayoutWrapper>
  );
}

