// app/about-us/page.tsx
// About Us page with improved readability and layout

"use client";

import LayoutWrapper from "@/components/LayoutWrapper";

export default function AboutUsPage() {
  return (
    <LayoutWrapper>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            About Us
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last updated: 19 December 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm sm:text-[15px] leading-relaxed text-slate-300">
          <p>
            Welcome to Movigoo - your premier destination for cinematic event discovery and seamless booking experiences.
          </p>

          <p>
            Movigoo is currently in a soft-launch phase. During this period, some events are hosted directly by Movigoo as pilot events to ensure a smooth and reliable booking experience. We are gradually onboarding third-party event organizers, and their events will be available on the platform as our network expands.
          </p>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Legal Business Information</h2>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Business Name</h3>
                <p className="mt-1 text-white">Movigoo</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Registered Address</h3>
                <p className="mt-1 text-white">
                  Akshay Garden Apartment<br />
                  I Block 102<br />
                  Banashankari Badavane<br />
                  Vidyanagar<br />
                  Hubli
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Business Category</h3>
                <p className="mt-1 text-white">Event Ticketing and Booking Platform</p>
                <p className="mt-2 text-sm text-slate-400">
                  We specialize in providing a premium platform for discovering and booking tickets to concerts, sports events, 
                  arts performances, and various entertainment experiences.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Our Mission</h2>
            <p>
              At Movigoo, we are dedicated to revolutionizing the event discovery and booking experience. We combine 
              cutting-edge technology with premium design to create a seamless, enjoyable journey from event discovery 
              to ticket purchase. Our platform brings together the best events from across India, making it easy for 
              users to find and book their perfect entertainment experiences.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">What We Do</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="mb-2 font-semibold text-white">Event Discovery</h3>
                <p className="text-sm">
                  Explore a curated collection of premium events including concerts, sports matches, theater performances, 
                  and cultural events.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="mb-2 font-semibold text-white">Seamless Booking</h3>
                <p className="text-sm">
                  Experience frictionless ticket booking with secure payment processing and instant confirmation.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="mb-2 font-semibold text-white">Premium Experience</h3>
                <p className="text-sm">
                  Enjoy a beautifully designed platform with real-time availability, interactive features, and 
                  personalized recommendations.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="mb-2 font-semibold text-white">Customer Support</h3>
                <p className="text-sm">
                  Our dedicated support team is here to help you with any questions, booking issues, or special requests.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Contact Us</h2>
            <p>
              If you have any questions, concerns, or feedback, please don&apos;t hesitate to reach out to us. Our team 
              is committed to providing you with the best possible service.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              For support inquiries, please visit our support center or contact us through the platform.
            </p>
          </section>
        </div>
      </main>
    </LayoutWrapper>
  );
}

