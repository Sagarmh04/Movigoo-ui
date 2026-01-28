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
            Last updated: 28 January 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm sm:text-[15px] leading-relaxed text-slate-300">
          <section>
            <h2 className="text-base font-semibold text-white mb-2">Welcome to Movigoo</h2>
            <p>
              Your premier destination for cinematic event discovery and seamless booking experiences.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Current Status: Soft Launch</h2>
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
              <p>
                Movigoo is currently in a soft-launch phase. During this period, select events are hosted directly by Movigoo or partnered pilot organizers to ensure a smooth and reliable booking experience. We are actively expanding our network to bring you more third-party events soon.
              </p>
            </div>
          </section>

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
                  I Block 102, Banashankari Badavane<br />
                  Vidyanagar, Hubli, Karnataka
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Business Category</h3>
                <p className="mt-1 text-white">Event Ticketing and Booking Platform</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Our Mission</h2>
            <p>
              At Movigoo, we are dedicated to revolutionizing the event discovery and booking experience in Hubli and beyond. We combine cutting-edge technology with premium design to create a seamless, enjoyable journey from event discovery to ticket purchase.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">What We Do</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="mb-2 font-semibold text-white">Event Discovery</h3>
                <p className="text-sm">
                  Explore a curated collection of premium events including concerts, workshops, college fests, and cultural experiences.
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
                  Enjoy a beautifully designed platform with real-time availability and personalized recommendations.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">Contact Us</h2>
            <p>
              We love hearing from our users. If you have any questions, feedback, or want to list your event with us, please reach out.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-white">
                <strong>Email:</strong> <a href="mailto:movigootech@gmail.com" className="text-accent-amber hover:underline">movigootech@gmail.com</a>
              </p>
              <p className="mt-2 text-white">
                <strong>Address:</strong> Vidyanagar, Hubli, Karnataka
              </p>
            </div>
          </section>
        </div>
      </main>
    </LayoutWrapper>
  );
}

