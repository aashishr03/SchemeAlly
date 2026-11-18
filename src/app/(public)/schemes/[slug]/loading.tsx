import React from "react";
import { Card } from "@/components/ui/card";

export default function SchemeDetailLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading scheme details"
      className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8"
    >
      <div className="h-5 w-44 rounded-lg bg-slate-200/80 animate-pulse" />
      <Card variant="glass" className="p-8 space-y-5">
        <div className="flex gap-2">
          <div className="h-6 w-36 rounded-full bg-slate-200/80 animate-pulse" />
          <div className="h-6 w-28 rounded-full bg-slate-200/80 animate-pulse" />
        </div>
        <div className="h-10 w-3/4 rounded-xl bg-slate-200/80 animate-pulse" />
        <div className="h-20 w-full rounded-xl bg-slate-200/60 animate-pulse" />
      </Card>
    </div>
  );
}
