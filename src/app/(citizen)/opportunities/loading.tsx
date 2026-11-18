import React from "react";
import { Card } from "@/components/ui/card";

export default function OpportunitiesLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading your scheme opportunities / உங்கள் திட்ட வாய்ப்புகள் ஏற்றப்படுகின்றன"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8"
    >
      <div className="space-y-3 max-w-2xl">
        <div className="h-6 w-48 rounded-full bg-slate-200/80 animate-pulse" />
        <div className="h-10 w-3/4 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-5 w-full rounded-xl bg-slate-200/60 animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="h-8 w-28 rounded-full bg-slate-200/70 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} variant="glass" className="p-6 space-y-4">
            <div className="h-6 w-4/5 rounded-xl bg-slate-200/80 animate-pulse" />
            <div className="h-16 w-full rounded-xl bg-slate-200/60 animate-pulse" />
            <div className="h-10 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  );
}
