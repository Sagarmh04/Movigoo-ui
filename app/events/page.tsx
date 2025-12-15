import HostedEventListClient from "@/components/HostedEventListClient";

export const metadata = {
  title: "Events • Movigoo"
};

export default function EventsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Browse</p>
        <h1 className="text-4xl font-semibold text-white">Premiere bookings</h1>
        <p className="text-slate-300">
          Curated happenings with glass filters, parallax posters, and real-time availability.
        </p>
      </div>
      {/* Client component that loads real published events from Firestore */}
      <HostedEventListClient />
    </div>
  );
}

