"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "@/components/icons";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { saveKpiAdjustment } from "@/lib/admin/analytics-actions";
import type { KpiKey } from "@/lib/data/analytics-types";
import { toast } from "@/lib/toast/store";

type KpiEditModalProps = {
  open: boolean;
  onClose: () => void;
  kpiKey: KpiKey;
  kpiTitle: string;
  isCurrency?: boolean;
  isIntegerOnly?: boolean;
  currentCalculated: number;
  currentAdjustment: number;
  selectedRestaurantId?: string;
  restaurants?: { id: string; name: string }[];
  restaurantScope?: string;
  restaurantId?: string | null;
  startDate: string;
  endDate: string;
};

export function KpiEditModal({
  open,
  onClose,
  kpiKey,
  kpiTitle,
  isCurrency = false,
  isIntegerOnly = false,
  currentCalculated,
  currentAdjustment,
  selectedRestaurantId,
  restaurants,
  restaurantScope,
  restaurantId,
  startDate,
  endDate,
}: KpiEditModalProps) {
  const resolvedRestId =
    restaurantId !== undefined
      ? restaurantId
      : selectedRestaurantId && selectedRestaurantId !== "all"
        ? selectedRestaurantId
        : null;

  const resolvedScope =
    restaurantScope ??
    (resolvedRestId
      ? restaurants?.find((r) => r.id === resolvedRestId)?.name || "Restaurant Scope"
      : "All Restaurants");
  const [adjustmentInput, setAdjustmentInput] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const numAdjustment = adjustmentInput.trim() === "" ? 0 : Number(adjustmentInput);
  const isValidNumber = !isNaN(numAdjustment);

  // Validation
  const isIntegerValid = !isIntegerOnly || Number.isInteger(numAdjustment);
  const finalValue = currentCalculated + (isValidNumber ? numAdjustment : 0);
  const isCountNonNegative = !isIntegerOnly || finalValue >= 0;
  const isReasonValid = reason.trim().length >= 3;

  const canProceed =
    isValidNumber &&
    isIntegerValid &&
    isCountNonNegative &&
    isReasonValid &&
    adjustmentInput.trim() !== "";

  const formatVal = (v: number) => {
    if (isCurrency) {
      return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return v.toLocaleString("en-IN");
  };

  const isRange = startDate !== endDate;
  const dateLabel = isRange ? `${startDate} to ${endDate}` : startDate;

  function handleOpenConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!canProceed) return;
    setConfirmOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveKpiAdjustment({
        kpiKey,
        restaurantId: resolvedRestId,
        restaurantScope: resolvedScope,
        startDate,
        endDate,
        calculatedValue: currentCalculated,
        adjustmentAmount: numAdjustment,
        reason: reason.trim(),
      });

      if (res.ok) {
        toast.success(`${kpiTitle} adjustment saved.`);
        setConfirmOpen(false);
        setAdjustmentInput("");
        setReason("");
        onClose();
      } else {
        toast.error(res.error || "Failed to save adjustment.");
        setConfirmOpen(false);
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !val && !pending && onClose()}>
        <DialogContent className="max-w-md p-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <DialogTitle className="font-heading text-lg font-bold">
                Edit {kpiTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Apply a manual adjustment with a documented reason.
              </DialogDescription>
            </div>
          </div>

          {/* Context Scope Info Card */}
          <div className="mt-2 rounded-2xl bg-secondary/50 p-3 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Scope:</span>
              <span className="font-semibold text-foreground">{resolvedScope}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-semibold text-foreground">{dateLabel}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Auto Calculated:</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatVal(currentCalculated)}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Existing Adjustment:</span>
              <span className="font-semibold tabular-nums">
                {currentAdjustment !== 0
                  ? currentAdjustment > 0
                    ? `+${formatVal(currentAdjustment)}`
                    : formatVal(currentAdjustment)
                  : "None"}
              </span>
            </div>
          </div>

          <form onSubmit={handleOpenConfirm} className="mt-4 flex flex-col gap-4">
            {/* Adjustment Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="kpi-adjustment-input" className="text-xs font-semibold text-foreground">
                Adjustment Amount {isCurrency ? "(₹)" : "(Count)"}
              </label>
              <input
                id="kpi-adjustment-input"
                type="number"
                step={isIntegerOnly ? "1" : "any"}
                value={adjustmentInput}
                onChange={(e) => setAdjustmentInput(e.target.value)}
                placeholder={isCurrency ? "e.g. +90 or -200" : "e.g. +5 or -2"}
                required
                className="h-10 rounded-xl border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter a positive (e.g. 50) or negative (e.g. -50) value.
                {isIntegerOnly && " Whole numbers only."}
              </p>
            </div>

            {/* Live Calculation Preview */}
            {isValidNumber && adjustmentInput.trim() !== "" && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span>Calculated ({formatVal(currentCalculated)}) + Adj ({numAdjustment > 0 ? `+${formatVal(numAdjustment)}` : formatVal(numAdjustment)}):</span>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    = {formatVal(finalValue)}
                  </span>
                </div>
                {!isCountNonNegative && (
                  <p className="mt-1 font-semibold text-destructive">
                    Error: The final count cannot be below zero.
                  </p>
                )}
                {!isIntegerValid && (
                  <p className="mt-1 font-semibold text-destructive">
                    Error: Whole numbers only for this metric.
                  </p>
                )}
              </div>
            )}

            {/* Reason input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="kpi-adjustment-reason" className="text-xs font-semibold text-foreground">
                Reason for Adjustment <span className="text-destructive">*</span>
              </label>
              <textarea
                id="kpi-adjustment-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this adjustment is needed (e.g., cash settlement correction, customer refund at gate)"
                required
                className="rounded-xl border bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Action buttons */}
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="h-9 rounded-full border border-border px-4 text-xs font-semibold hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canProceed || pending}
                className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pending && <Loader2 className="size-3.5 animate-spin" />}
                Review & Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={(val) => !val && !pending && setConfirmOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {kpiTitle} Adjustment</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to apply this adjustment?
              <br />
              <strong>Scope:</strong> {restaurantScope} ({dateLabel})
              <br />
              <strong>Calculated:</strong> {formatVal(currentCalculated)}
              <br />
              <strong>Adjustment:</strong> {numAdjustment > 0 ? `+${formatVal(numAdjustment)}` : formatVal(numAdjustment)}
              <br />
              <strong>New Displayed Value:</strong> {formatVal(finalValue)}
              <br />
              <strong>Reason:</strong> &ldquo;{reason}&rdquo;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
