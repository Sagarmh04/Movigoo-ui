// components/booking/StepIndicator.tsx
"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  currentStep: number;
  totalSteps?: number;
};

const steps = [
  { number: 1, label: "Event Details" },
  { number: 2, label: "Tickets" },
  { number: 3, label: "Review & Pay" },
];

export default function StepIndicator({ currentStep, totalSteps = 3 }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all sm:h-12 sm:w-12",
                    isCompleted
                      ? "border-[#0B62FF] bg-[#0B62FF] text-white"
                      : isCurrent
                      ? "border-[#0B62FF] bg-[#0B62FF]/20 text-[#0B62FF]"
                      : "border-slate-600 bg-slate-800/50 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check size={20} className="text-white" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                {/* Step Label */}
                <span
                  className={cn(
                    "mt-2 hidden text-xs font-medium sm:block",
                    isCurrent ? "text-[#0B62FF]" : isCompleted ? "text-slate-300" : "text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-all sm:mx-4",
                    isCompleted ? "bg-[#0B62FF]" : "bg-slate-600"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

