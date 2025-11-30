import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Coming Soon • Movigoo"
};

export default function ComingSoonPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Coming soon</p>
        <h1 className="text-4xl font-semibold text-white">Future drops</h1>
        <p className="text-slate-300">
          Reserve early access for unreleased experiences with limited seats.
        </p>
      </div>
      <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Fall 2025</p>
            <h2 className="text-2xl font-semibold text-white">Celestial Opera Nights</h2>
            <p className="text-slate-300">Immersive opera within a kinetic aurora dome.</p>
          </div>
          <Button className="rounded-2xl">Get notified</Button>
        </div>
      </div>
    </div>
  );
}

