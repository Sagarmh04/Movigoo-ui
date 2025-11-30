import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = ({
  className,
  ...props
}: TooltipPrimitive.TooltipContentProps) => (
  <TooltipPrimitive.Content
    sideOffset={8}
    className={cn(
      "z-50 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-2xl",
      className
    )}
    {...props}
  />
);

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };

