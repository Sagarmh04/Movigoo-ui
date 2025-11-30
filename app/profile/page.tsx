import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Profile • Movigoo"
};

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Profile</p>
        <h1 className="text-4xl font-semibold text-white">Aarav Kapoor</h1>
        <p className="text-slate-300">Organizer • Movigoo Premier access</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-lg font-semibold text-white">Contact</p>
          <Input defaultValue="Aarav Kapoor" />
          <Input defaultValue="aarav@movigoo.com" />
          <Button className="rounded-2xl">Save changes</Button>
        </section>
        <section className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <p className="text-lg font-semibold text-white">Organizer perks</p>
          <ul className="space-y-2 text-sm text-emerald-100">
            <li>• Launch new events with premium layout templates.</li>
            <li>• Track conversions in real time.</li>
            <li>• Priority concierge for creator payouts.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

