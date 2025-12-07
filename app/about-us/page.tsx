export const metadata = {
  title: "About Us • Movigoo",
  description: "Learn about Movigoo - Premium event discovery and booking platform"
};

export default function AboutUsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold text-white">About Us</h1>
        <p className="text-lg text-slate-300">
          Welcome to Movigoo - your premier destination for cinematic event discovery and seamless booking experiences.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Legal Business Information</h2>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Business Name</h3>
            <p className="mt-1 text-lg text-white">Movigoo</p>
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

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Our Mission</h2>
        <p className="text-slate-300 leading-relaxed">
          At Movigoo, we are dedicated to revolutionizing the event discovery and booking experience. We combine 
          cutting-edge technology with premium design to create a seamless, enjoyable journey from event discovery 
          to ticket purchase. Our platform brings together the best events from across India, making it easy for 
          users to find and book their perfect entertainment experiences.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What We Do</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-2 font-semibold text-white">Event Discovery</h3>
            <p className="text-sm text-slate-300">
              Explore a curated collection of premium events including concerts, sports matches, theater performances, 
              and cultural events.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-2 font-semibold text-white">Seamless Booking</h3>
            <p className="text-sm text-slate-300">
              Experience frictionless ticket booking with secure payment processing and instant confirmation.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-2 font-semibold text-white">Premium Experience</h3>
            <p className="text-sm text-slate-300">
              Enjoy a beautifully designed platform with real-time availability, interactive features, and 
              personalized recommendations.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-2 font-semibold text-white">Customer Support</h3>
            <p className="text-sm text-slate-300">
              Our dedicated support team is here to help you with any questions, booking issues, or special requests.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
        <p className="text-slate-300">
          If you have any questions, concerns, or feedback, please don&apos;t hesitate to reach out to us. Our team 
          is committed to providing you with the best possible service.
        </p>
        <p className="text-slate-400 text-sm">
          For support inquiries, please visit our support center or contact us through the platform.
        </p>
      </section>
    </div>
  );
}

