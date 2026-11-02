"use client";

import { useState, useTransition } from "react";
import { Loader2, RotateCcw } from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { revertKpiAdjustment } from "@/lib/admin/analytics-actions";
import type { KpiAdjustmentRecord } from "@/lib/data/analytics-types";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

type AdjustmentAuditLogProps = {
  auditLog: KpiAdjustmentRecord[];
};

export function AdjustmentAuditLog({ auditLog }: AdjustmentAuditLogProps) {
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const kpiLabels: Record<string, string> = {
    total_collected: "Total Collected Amount",
    delivered_orders: "Delivered Orders",
    commission_profit: "Commission Profit",
    orders_placed: "Orders Placed",
  };

  function handleRevert() {
    if (!revertingId) return;
    startTransition(async () => {
      const res = await revertKpiAdjustment(revertingId, "Reversed by admin");
      if (res.ok) {
        toast.success("Adjustment reverted.");
        setRevertingId(null);
      } else {
        toast.error(res.error || "Failed to revert adjustment.");
      }
    });
  }

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
          KPI Adjustment Audit History
        </h2>
        <p className="text-xs text-muted-foreground">
          Immutable audit trail of all manual adjustments and administrative corrections.
        </p>
      </div>

      {auditLog.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-2xl bg-secondary/30 text-center">
          <p className="text-xs text-muted-foreground">No manual adjustments recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/50 bg-secondary/50 font-bold text-muted-foreground">
              <tr>
                <th className="px-3.5 py-2.5">Date & Time (IST)</th>
                <th className="px-3.5 py-2.5">KPI Metric</th>
                <th className="px-3.5 py-2.5">Scope</th>
                <th className="px-3.5 py-2.5">Business Date</th>
                <th className="px-3.5 py-2.5 text-right">Calculated</th>
                <th className="px-3.5 py-2.5 text-right">Adjustment</th>
                <th className="px-3.5 py-2.5 text-right">Final Displayed</th>
                <th className="px-3.5 py-2.5">Reason</th>
                <th className="px-3.5 py-2.5">Admin</th>
                <th className="px-3.5 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {auditLog.map((entry) => {
                const isCurrency =
                  entry.kpiKey === "total_collected" || entry.kpiKey === "commission_profit";
                const prefix = isCurrency ? "₹" : "";
                const isSingleDate = entry.startDate === entry.endDate;
                const dateDisplay = isSingleDate
                  ? entry.startDate
                  : `${entry.startDate} → ${entry.endDate}`;

                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "transition hover:bg-secondary/20",
                      !entry.isActive && "opacity-50 line-through bg-secondary/10",
                    )}
                  >
                    <td className="px-3.5 py-2.5 font-medium whitespace-nowrap text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-foreground">
                      {kpiLabels[entry.kpiKey] || entry.kpiKey}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                        {entry.restaurantScope}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-muted-foreground">
                      {dateDisplay}
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums">
                      {prefix}
                      {entry.calculatedValue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold tabular-nums">
                      <span
                        className={cn(
                          entry.adjustmentAmount > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {entry.adjustmentAmount > 0 ? `+${prefix}` : `-${prefix}`}
                        {Math.abs(entry.adjustmentAmount).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-extrabold text-foreground tabular-nums">
                      {prefix}
                      {entry.finalValue.toLocaleString("en-IN")}
                    </td>
                    <td className="max-w-xs px-3.5 py-2.5 text-foreground truncate" title={entry.reason}>
                      {entry.reason}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap text-muted-foreground">
                      {entry.adminName}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      {entry.isActive ? (
                        <button
                          type="button"
                          onClick={() => setRevertingId(entry.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
                        >
                          <RotateCcw className="size-3" aria-hidden="true" />
                          Revert
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Reversed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation modal for reverting an adjustment */}
      <AlertDialog
        open={revertingId !== null}
        onOpenChange={(val) => !val && !pending && setRevertingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert Adjustment?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will deactivate the selected manual adjustment. The underlying calculated value
              will become the active metric again. The history record will be retained for audit
              integrity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={handleRevert}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Revert Adjustment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
