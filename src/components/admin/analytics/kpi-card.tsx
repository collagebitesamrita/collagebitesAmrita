"use client";

import { PencilSimple, ArrowsDownUp, ArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  subtitle: string;
  calculatedValue: number;
  adjustment: number;
  finalValue: number;
  isCurrency?: boolean;
  isHero?: boolean;
  onEdit: () => void;
  onConfigureRates?: () => void;
  icon?: React.ReactNode;
};

export function KpiCard({
  title,
  subtitle,
  calculatedValue,
  adjustment,
  finalValue,
  isCurrency = false,
  isHero = false,
  onEdit,
  onConfigureRates,
  icon,
}: KpiCardProps) {
  const formatVal = (v: number) => {
    if (isCurrency) {
      return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return v.toLocaleString("en-IN");
  };

  const hasAdjustment = adjustment !== 0;

  if (isHero) {
    return (
      <div className="relative flex flex-col justify-between rounded-2xl border-2 border-orange-300/90 bg-gradient-to-br from-orange-50/80 via-orange-50/40 to-background p-4 sm:p-5 shadow-card transition-shadow hover:shadow-md dark:border-orange-500/40 dark:from-orange-950/20 dark:to-card">
        <div>
          {/* Top Row: Title, Action Buttons, Icon */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                {title}
              </span>

              {onConfigureRates && (
                <button
                  type="button"
                  onClick={onConfigureRates}
                  className="inline-flex items-center gap-1 rounded-full border border-orange-200/90 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-orange-700 shadow-2xs hover:bg-orange-100/70 dark:border-orange-800/80 dark:bg-card dark:text-orange-300 transition-colors"
                >
                  <ArrowsDownUp className="size-2.5" aria-hidden="true" />
                  <span>Rates</span>
                </button>
              )}

              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-full border border-orange-200/90 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-orange-700 shadow-2xs hover:bg-orange-100/70 dark:border-orange-800/80 dark:bg-card dark:text-orange-300 transition-colors"
              >
                <PencilSimple className="size-2.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>

            {/* Right Icon */}
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
              {icon}
            </div>
          </div>

          {/* Big Number */}
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-orange-600 dark:text-orange-500 tabular-nums">
              {formatVal(finalValue)}
            </span>
            {hasAdjustment && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                  adjustment > 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                )}
                title={`Calculated: ${formatVal(calculatedValue)}, Adjustment: ${adjustment > 0 ? "+" : ""}${formatVal(adjustment)}`}
              >
                {adjustment > 0 ? `+${formatVal(adjustment)}` : formatVal(adjustment)} adj
              </span>
            )}
          </div>
        </div>

        {/* Subtitle & Edit Link */}
        <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t border-orange-200/40 dark:border-orange-900/30">
          <span className="text-muted-foreground">{subtitle}</span>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-0.5 font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
          >
            <span>Edit</span>
            <ArrowRight className="size-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-card transition-shadow hover:shadow-md">
      <div>
        {/* Top Row: Title, Edit Button, Icon */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-2xs hover:border-orange-400 hover:text-orange-600 transition-colors"
            >
              <PencilSimple className="size-2.5" aria-hidden="true" />
              <span>Edit</span>
            </button>
          </div>

          {/* Right Icon */}
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-orange-200/60 bg-orange-50 text-orange-600 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-400">
            {icon}
          </div>
        </div>

        {/* Big Number */}
        <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
          <span className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
            {formatVal(finalValue)}
          </span>
          {hasAdjustment && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                adjustment > 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
              )}
              title={`Calculated: ${formatVal(calculatedValue)}, Adjustment: ${adjustment > 0 ? "+" : ""}${formatVal(adjustment)}`}
            >
              {adjustment > 0 ? `+${formatVal(adjustment)}` : formatVal(adjustment)} adj
            </span>
          )}
        </div>
      </div>

      {/* Subtitle */}
      <div className="mt-3 text-xs text-muted-foreground pt-1">
        <span>{subtitle}</span>
      </div>
    </div>
  );
}
