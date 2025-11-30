export const metadata = {
  title: "Locations • Movigoo"
};

const venues = [
  {
    title: "NMACC Grand Theatre",
    city: "Mumbai",
    vibe: "Immersive concerts",
    capacity: "2,000 seats",
    upgrades: "Infinity lounges + biometric entry"
  },
  {
    title: "Qutub Panorama",
    city: "Delhi",
    vibe: "Cinematic outdoor",
    capacity: "800 domes",
    upgrades: "Dolby Atmos domes + tasting menus"
  },
  {
    title: "Nova Arena",
    city: "Hyderabad",
    vibe: "Esports stadium",
    capacity: "4,500 fans",
    upgrades: "Reactive LED tunnels + AR overlays"
  }
];

export default function LocationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Venues</p>
        <h1 className="text-4xl font-semibold text-white">Signature stages</h1>
        <p className="text-slate-300">
          Movigoo partners with spaces designed for immersive storytelling.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {venues.map((venue) => (
          <div
            key={venue.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-card-glass"
          >
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{venue.city}</p>
            <h2 className="text-xl font-semibold text-white">{venue.title}</h2>
            <p className="text-sm text-slate-300">{venue.vibe}</p>
            <p className="text-xs text-slate-400">Capacity: {venue.capacity}</p>
            <p className="mt-3 text-sm text-slate-200">{venue.upgrades}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

