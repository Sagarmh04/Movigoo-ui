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
            Last updated: 28 January 2026
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
                  Akshay Garden Apartment, I Block 102, Banashankari Badavane, Vidyanagar, Hubli</p>
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
                  <li>Payment information (processed securely through third-party gateways)</li>
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
                  <li>Payment method details (transaction IDs)</li>
                  <li>Event preferences and attendee information</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-2">1.3 Technical Information</h3>
                <p className="mt-2">
                  When you visit our website or use our mobile application, we automatically collect:
                </p>
                <ul className="mt-3 ml-6 list-disc space-y-2">
                  <li>IP address and device identifiers</li>
                  <li>Browser type and operating system</li>
                  <li>Cookies and usage patterns</li>
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
              <li><strong>Service Delivery:</strong> To process bookings and deliver digital tickets</li>
              <li><strong>Account Management:</strong> To manage your profile and authentication</li>
              <li><strong>Communication:</strong> To send booking confirmations and event updates</li>
              <li><strong>Payment Processing:</strong> To securely process transactions via PhonePe/Razorpay</li>
              <li><strong>Marketing:</strong> To send promotional offers (only with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Payment Information & Third-Party Processors</h2>
            <p>
              Movigoo uses trusted third-party payment processors. We do not store your complete credit card or banking details. Payment information is processed directly by our partners, including:
            </p>
            <ul className="ml-6 list-disc space-y-2 mt-3">
              <li>PhonePe</li>
              <li>Razorpay</li>
              <li>PayU</li>
            </ul>
            <p className="mt-3">
              By using our services, you agree to the privacy policies of these payment processors.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Cookies and Tracking</h2>
            <p>
              We use cookies for authentication, security, and analytics. You can control cookie preferences through your browser settings, though this may affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">5. Information Sharing</h2>
            <p>
              We may share your information with:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Event Organizers:</strong> Necessary attendee details for event entry</li>
              <li><strong>Service Providers:</strong> Partners who assist in payments and analytics</li>
              <li><strong>Legal Authorities:</strong> If required by law or court order</li>
            </ul>
            <p className="mt-3">
              <strong>Note:</strong> We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">6. Data Security</h2>
            <p>
              We implement SSL/TLS encryption and secure infrastructure. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">7. Your Rights</h2>
            <p>
              You have the right to access, correct, or request deletion of your data. Contact us at <strong>movigootech@gmail.com</strong> to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">8. Children&apos;s Privacy</h2>
            <p>
              Our services are not intended for individuals under 18. We do not knowingly collect data from minors.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">9. Retention of Information</h2>
            <p>
              We retain your personal information as long as necessary to fulfill the purposes outlined here and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">10. Changes to Policy</h2>
            <p>
              We may update this policy periodically. Continued use of our services constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">11. Contact Us & Grievance Officer</h2>
            <p>
              For any privacy concerns, complaints, or questions, please contact:
            </p>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-white"><strong>Movigoo Privacy Team</strong></p>
              <p className="mt-2 text-slate-300">
                Akshay Garden Apartment, I Block 102, Banashankari Badavane<br />
                Vidyanagar, Hubli
              </p>
              <p className="mt-3">
                Email: <a href="mailto:movigootech@gmail.com" className="text-accent-amber hover:underline">movigootech@gmail.com</a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </LayoutWrapper>
  );
}

