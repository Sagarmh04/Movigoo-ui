// app/locations/page.tsx
// Venues page with informational message

"use client";

import LayoutWrapper from "@/components/LayoutWrapper";

export default function LocationsPage() {
  return (
    <LayoutWrapper>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Explore Venues
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm sm:text-[15px] leading-relaxed text-slate-300">
          <p>
            This feature will start shortly. Stay tuned.
          </p>
          <p>
            We are currently working on onboarding verified venues and event spaces.
          </p>
          <p>
            Once available, you will be able to explore venues and upcoming events hosted at these locations directly on Movigoo.
          </p>
        </div>
      </main>
    </LayoutWrapper>
  );
}

