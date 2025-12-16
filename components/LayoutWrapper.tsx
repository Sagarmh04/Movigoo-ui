"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileDock from "@/components/MobileDock";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-white/90 focus:px-4 focus:py-2 focus:text-slate-900"
      >
        Skip to content
      </a>
      <div className="relative min-h-screen overflow-hidden bg-lux-gradient">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-50 blur-3xl">
          <div className="absolute -top-10 left-1/3 h-72 w-72 rounded-full bg-gradient-indigo mix-blend-screen" />
          <div className="absolute top-1/2 right-10 h-80 w-80 rounded-full bg-accent-amber/50 mix-blend-screen" />
        </div>
        <Header />
        <main
          id="main"
          className="mx-auto flex min-h-screen w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-32 pt-28 sm:px-6 lg:px-10"
        >
          {children}
        </main>
        <Footer />
      </div>
      <MobileDock />
    </>
  );
}

