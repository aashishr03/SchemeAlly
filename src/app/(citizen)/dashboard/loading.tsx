import React from "react";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading your dashboard"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8"
    >
      <Card variant="glass" className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-5">
          <div className="space-y-3">
            <div className="h-5 w-28 rounded-full bg-slate-200/80 animate-pulse" />
            <div className="h-9 w-64 rounded-2xl bg-slate-200/80 animate-pulse" />
            <div className="h-4 w-80 max-w-full rounded-xl bg-slate-200/60 animate-pulse" />
          </div>
          <div className="hidden sm:flex gap-3">
            <div className="h-10 w-40 rounded-full bg-slate-200/70 animate-pulse" />
            <div className="h-10 w-32 rounded-full bg-slate-200/70 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4 rounded-2xl bg-slate-100/70 p-5">
          <div className="h-5 w-48 rounded bg-slate-200/80 animate-pulse" />
          <div className="h-3 w-full rounded-full bg-slate-200/80 animate-pulse" />
          <div className="h-4 w-64 rounded bg-slate-200/60 animate-pulse" />
        </div>
      </Card>
      <Card variant="glass" className="p-6 sm:p-8 space-y-5">
        <div className="h-6 w-64 rounded-xl bg-slate-200/80 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-24 rounded-2xl bg-slate-200/60 animate-pulse"
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
