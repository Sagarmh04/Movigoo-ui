export const metadata = {
  title: "Privacy Policy • Movigoo",
  description: "Movigoo Privacy Policy - How we collect, use, and protect your personal information"
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold text-white">Privacy Policy</h1>
        <p className="text-sm text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className="text-lg text-slate-300">
          At Movigoo, we are committed to protecting your privacy and ensuring the security of your personal information. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
          platform and services.
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
        <h2 className="text-2xl font-semibold text-white">1. Information We Collect</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">1.1 Personal Information</h3>
            <p className="mt-2 text-slate-300">
              When you register for an account, make a booking, or interact with our services, we may collect the following information:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Name, email address, phone number</li>
              <li>Date of birth and age verification details</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely through third-party payment gateways)</li>
              <li>Government-issued identification (when required for event verification)</li>
              <li>Profile picture and preferences</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">1.2 Transaction Information</h3>
            <p className="mt-2 text-slate-300">
              We collect information about your transactions, including:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
              <li>Booking history and ticket purchases</li>
              <li>Payment method and transaction details</li>
              <li>Event preferences and search history</li>
              <li>Attendee information for group bookings</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">1.3 Technical Information</h3>
            <p className="mt-2 text-slate-300">
              When you visit our website or use our mobile application, we automatically collect:
            </p>
            <ul className="mt-3 ml-6 list-disc space-y-2 text-slate-300">
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

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">2. How We Use Your Information</h2>
        <p className="text-slate-300">
          We use the collected information for the following purposes:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
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

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">3. Payment Information and Third-Party Payment Processors</h2>
        <p className="text-slate-300">
          Movigoo uses trusted third-party payment processors to handle all payment transactions securely. We do not store 
          your complete credit card or debit card details on our servers. Payment information is processed directly by 
          our payment partners, including but not limited to:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>PayU India Private Limited</li>
          <li>Razorpay Software Private Limited</li>
          <li>Other authorized payment gateway providers</li>
        </ul>
        <p className="mt-3 text-slate-300">
          These payment processors are PCI-DSS compliant and use industry-standard encryption to protect your financial 
          information. By using our services, you agree to the privacy policies and terms of service of these payment 
          processors. We may receive transaction status and limited payment information necessary to complete your booking.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">4. Cookies and Tracking Technologies</h2>
        <p className="text-slate-300">
          We use cookies, web beacons, and similar tracking technologies to enhance your experience on our platform:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li><strong>Essential Cookies:</strong> Required for basic platform functionality, authentication, and security</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
          <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
        </ul>
        <p className="mt-3 text-slate-300">
          You can control cookie preferences through your browser settings. However, disabling certain cookies may 
          affect platform functionality.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">5. Information Sharing and Disclosure</h2>
        <p className="text-slate-300">
          We may share your information in the following circumstances:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li><strong>Event Organizers:</strong> We share necessary booking and attendee information with event organizers to facilitate event entry and management</li>
          <li><strong>Service Providers:</strong> We share information with trusted third-party service providers who assist us in operations, payment processing, analytics, and customer support</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation</li>
          <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets, your information may be transferred</li>
          <li><strong>With Your Consent:</strong> We may share information when you explicitly consent to such sharing</li>
        </ul>
        <p className="mt-3 text-slate-300">
          We do not sell your personal information to third parties for marketing purposes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">6. Data Security</h2>
        <p className="text-slate-300">
          We implement industry-standard security measures to protect your personal information:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>SSL/TLS encryption for data transmission</li>
          <li>Secure server infrastructure and access controls</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Employee training on data protection</li>
          <li>Compliance with applicable data protection regulations</li>
        </ul>
        <p className="mt-3 text-slate-300">
          However, no method of transmission over the internet is 100% secure. While we strive to protect your information, 
          we cannot guarantee absolute security.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">7. Your Rights and Choices</h2>
        <p className="text-slate-300">
          You have the following rights regarding your personal information:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li><strong>Access:</strong> Request access to your personal information we hold</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal and contractual obligations)</li>
          <li><strong>Data Portability:</strong> Request a copy of your data in a structured format</li>
          <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
          <li><strong>Account Deletion:</strong> Request account closure and data deletion</li>
        </ul>
        <p className="mt-3 text-slate-300">
          To exercise these rights, please contact us through the contact information provided below.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">8. Children&apos;s Privacy</h2>
        <p className="text-slate-300">
          Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
          information from children. If you believe we have inadvertently collected information from a minor, please 
          contact us immediately.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">9. International Data Transfers</h2>
        <p className="text-slate-300">
          Your information may be transferred to and processed in countries other than India, including countries 
          with different data protection laws. We ensure appropriate safeguards are in place to protect your information 
          in accordance with this Privacy Policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">10. Retention of Information</h2>
        <p className="text-slate-300">
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy 
          Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Transaction records and 
          booking information may be retained for a longer period as required by law or for business purposes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">11. Changes to This Privacy Policy</h2>
        <p className="text-slate-300">
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
          We will notify you of significant changes by posting the updated policy on our website and updating the 
          &quot;Last updated&quot; date. Your continued use of our services after changes are made constitutes acceptance of 
          the updated policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">12. Grievance Officer</h2>
        <p className="text-slate-300">
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
          <p className="mt-3 text-slate-300">
            Email: <a href="mailto:privacy@movigoo.com" className="text-accent-amber hover:underline">privacy@movigoo.com</a>
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">13. Contact Us</h2>
        <p className="text-slate-300">
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
        </p>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white"><strong>Movigoo</strong></p>
          <p className="mt-2 text-slate-300">
            Akshay Garden Apartment<br />
            I Block 102, Banashankari Badavane<br />
            Vidyanagar, Hubli
          </p>
          <p className="mt-3 text-slate-300">
            Email: <a href="mailto:privacy@movigoo.com" className="text-accent-amber hover:underline">privacy@movigoo.com</a>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-400">
          By using Movigoo&apos;s services, you acknowledge that you have read, understood, and agree to this Privacy Policy. 
          If you do not agree with any part of this policy, please discontinue use of our services.
        </p>
      </section>
    </div>
  );
}

