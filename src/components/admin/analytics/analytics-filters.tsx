"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart } from "@/components/icons";
import type { DateFilterType } from "@/lib/data/analytics-types";
import { getTodayISTString } from "@/lib/data/analytics-types";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AnalyticsFiltersProps = {
  currentDateFilter: DateFilterType;
  currentStartDate: string;
  currentEndDate: string;
  currentRestaurantId: string;
  restaurants: { id: string; name: string }[];
};

export function AnalyticsFilters({
  currentDateFilter,
  currentStartDate,
  currentEndDate,
  currentRestaurantId,
  restaurants,
}: AnalyticsFiltersProps) {
  const router = useRouter();
  const today = getTodayISTString();

  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "range">(
    currentDateFilter === "custom_range" ? "range" : "single"
  );
  const [singleDate, setSingleDate] = useState(currentStartDate || today);
  const [rangeStart, setRangeStart] = useState(currentStartDate || today);
  const [rangeEnd, setRangeEnd] = useState(currentEndDate || today);

  function applyDateFilter(df: DateFilterType, s: string, e: string) {
    const params = new URLSearchParams();
    params.set("date", df);
    if (df === "custom_date") {
      params.set("startDate", s);
    } else if (df === "custom_range") {
      params.set("startDate", s);
      params.set("endDate", e);
    }
    if (currentRestaurantId && currentRestaurantId !== "all") {
      params.set("restaurant", currentRestaurantId);
    }
    router.push(`/admin/analytics?${params.toString()}`);
  }

  function handleSelectToday() {
    applyDateFilter("today", today, today);
  }

  function handleApplyCustom() {
    if (mode === "single") {
      applyDateFilter("custom_date", singleDate, singleDate);
    } else {
      let s = rangeStart;
      let e = rangeEnd;
      if (s > e) {
        const tmp = s;
        s = e;
        e = tmp;
      }
      applyDateFilter("custom_range", s, e);
    }
    setCustomDateOpen(false);
  }

  function handleSelectRestaurant(rId: string) {
    const params = new URLSearchParams();
    params.set("date", currentDateFilter);
    if (currentDateFilter === "custom_date") {
      params.set("startDate", currentStartDate);
    } else if (currentDateFilter === "custom_range") {
      params.set("startDate", currentStartDate);
      params.set("endDate", currentEndDate);
    }
    if (rId && rId !== "all") {
      params.set("restaurant", rId);
    }
    router.push(`/admin/analytics?${params.toString()}`);
  }

  // Format restaurant display name (e.g. Clg Bites Biryani Nation -> Biriyani Nation)
  function formatRestaurantName(name: string) {
    if (name.toLowerCase().includes("biryani nation")) {
      return "Biriyani Nation";
    }
    return name;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Date Filter Dialog */}
      <Dialog open={customDateOpen} onOpenChange={setCustomDateOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card p-6 shadow-xl">
          <DialogTitle className="font-heading text-lg font-bold text-foreground">
            Custom Date Filter
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Choose a single date or date range (inclusive, calculated in IST).
          </DialogDescription>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={cn(
                "flex-1 rounded-xl py-2 text-xs font-semibold transition-colors",
                mode === "single"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "border border-border/80 bg-background text-muted-foreground hover:bg-muted/50"
              )}
            >
              Single Date
            </button>
            <button
              type="button"
              onClick={() => setMode("range")}
              className={cn(
                "flex-1 rounded-xl py-2 text-xs font-semibold transition-colors",
                mode === "range"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "border border-border/80 bg-background text-muted-foreground hover:bg-muted/50"
              )}
            >
              Date Range
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {mode === "single" ? (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm text-foreground focus:border-orange-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm text-foreground focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm text-foreground focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCustomDateOpen(false)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCustom}
              className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Filter Buttons (Rendered on top right of header) */}
      <div className="flex items-center gap-2">
        {/* Today Button */}
        <button
          type="button"
          onClick={handleSelectToday}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs transition-all",
            currentDateFilter === "today"
              ? "bg-orange-500 text-white shadow-sm"
              : "border border-border/90 bg-background text-foreground hover:bg-muted/60"
          )}
        >
          <CalendarHeart className="size-3.5" aria-hidden="true" />
          <span>Today</span>
        </button>

        {/* Custom Date Button */}
        <button
          type="button"
          onClick={() => setCustomDateOpen(true)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs transition-all",
            currentDateFilter !== "today"
              ? "bg-orange-500 text-white shadow-sm"
              : "border border-border/90 bg-background text-foreground hover:bg-muted/60"
          )}
        >
          <CalendarHeart className="size-3.5" aria-hidden="true" />
          <span>Custom Date</span>
        </button>
      </div>

      {/* Restaurant Filter Pills Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* All Pill */}
        <button
          type="button"
          onClick={() => handleSelectRestaurant("all")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
            currentRestaurantId === "all"
              ? "bg-orange-500 text-white shadow-sm"
              : "border border-border/80 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          All
        </button>

        {/* Restaurant Pills */}
        {restaurants.map((r) => {
          const isSelected = currentRestaurantId === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRestaurant(r.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                isSelected
                  ? "bg-orange-500 text-white shadow-sm"
                  : "border border-border/80 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {formatRestaurantName(r.name)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
