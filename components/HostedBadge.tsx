import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const HostedBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200 shadow-glow",
      className
    )}
  >
    <Sparkles size={12} />
    Hosted by you
  </span>
);

export default HostedBadge;

