import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const metadata = {
  title: "Search • Movigoo"
};

export default function SearchPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Search />
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Discover</p>
          <h1 className="text-4xl font-semibold text-white">Search events</h1>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <Input placeholder="Artist, city, immersive tech..." className="rounded-2xl" />
        <div className="mt-4 flex flex-wrap gap-3">
          {["Film premieres", "Sound baths", "Esports", "Gala"].map((chip) => (
            <Button key={chip} variant="outline" size="pill" className="rounded-full">
              {chip}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

