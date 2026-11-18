import React from "react";
import { Card } from "@/components/ui/card";

export default function DiscoverLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading scheme catalogue"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8"
    >
      <div className="space-y-3 max-w-2xl">
        <div className="h-6 w-40 rounded-full bg-slate-200/80 animate-pulse" />
        <div className="h-10 w-3/4 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-5 w-full rounded-xl bg-slate-200/60 animate-pulse" />
      </div>

      <Card variant="glass" className="p-6 space-y-4">
        <div className="h-11 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-8 w-28 rounded-full bg-slate-200/70 animate-pulse"
            />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} variant="glass" className="p-6 space-y-4">
            <div className="h-6 w-36 rounded-full bg-slate-200/70 animate-pulse" />
            <div className="h-7 w-4/5 rounded-xl bg-slate-200/80 animate-pulse" />
            <div className="h-16 w-full rounded-xl bg-slate-200/60 animate-pulse" />
            <div className="h-12 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  );
}
