"use client";

import { useState, useTransition } from "react";
import { Loader2, PencilSimple, Storefront } from "@/components/icons";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { updateCommissionRate } from "@/lib/admin/analytics-actions";
import type { RestaurantCommissionConfig } from "@/lib/data/analytics-types";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

type CommissionConfigSectionProps = {
  configs: RestaurantCommissionConfig[];
};

export function CommissionConfigSection({ configs }: CommissionConfigSectionProps) {
  const [selectedRestId, setSelectedRestId] = useState<string>(configs[0]?.restaurantId || "");
  const [editingItem, setEditingItem] = useState<{
    restaurantId: string;
    restaurantName: string;
    categoryName: string;
    currentRate: number;
  } | null>(null);

  const [newRateInput, setNewRateInput] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const activeConfig = configs.find((c) => c.restaurantId === selectedRestId) || configs[0];

  function openEditModal(restId: string, restName: string, catName: string, rate: number) {
    setEditingItem({
      restaurantId: restId,
      restaurantName: restName,
      categoryName: catName,
      currentRate: rate,
    });
    setNewRateInput(String(rate));
  }

  function handleSaveRate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    const rateNum = Number(newRateInput);
    if (isNaN(rateNum) || rateNum < 0) {
      toast.error("Please enter a valid rate (₹0 or greater).");
      return;
    }

    startTransition(async () => {
      const res = await updateCommissionRate({
        restaurantId: editingItem.restaurantId,
        categoryName: editingItem.categoryName,
        newRate: rateNum,
      });

      if (res.ok) {
        toast.success(`Commission rate for ${editingItem.categoryName} updated to ₹${rateNum}.`);
        setEditingItem(null);
      } else {
        toast.error(res.error || "Failed to update commission rate.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
            Commission Rate Settings
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure per-item commission rates. Changing a rate takes effect immediately for future orders while preserving historical report records.
          </p>
        </div>
      </div>

      {/* Restaurant Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-3">
        {configs.map((c) => {
          const isSelected = c.restaurantId === activeConfig?.restaurantId;
          const cleanName = c.restaurantName.replace(/^Clg Bites\s+/i, "");
          return (
            <button
              key={c.restaurantId}
              type="button"
              onClick={() => setSelectedRestId(c.restaurantId)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              <Storefront className="size-3.5" aria-hidden="true" />
              <span>{cleanName}</span>
            </button>
          );
        })}
      </div>

      {/* Categories Grid for Selected Restaurant */}
      {activeConfig && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {activeConfig.categories.map((cat) => (
            <div
              key={cat.categoryName}
              className="flex flex-col justify-between rounded-2xl border border-border/60 bg-secondary/30 p-4 transition hover:bg-secondary/50"
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <span className="font-heading text-sm font-bold text-foreground">
                    {cat.categoryName}
                  </span>
                  {cat.categoryName === "Half" && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      New
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-extrabold text-foreground tabular-nums">
                    ₹{cat.rate}
                  </span>
                  <span className="text-xs text-muted-foreground">/ item</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                <span className="truncate">
                  {cat.updatedAt
                    ? `Updated ${new Date(cat.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
                    : "Initial rate"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    openEditModal(
                      activeConfig.restaurantId,
                      activeConfig.restaurantName,
                      cat.categoryName,
                      cat.rate,
                    )
                  }
                  className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground hover:border-primary/50 hover:text-primary"
                >
                  <PencilSimple className="size-3" aria-hidden="true" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Rate Dialog */}
      <Dialog
        open={editingItem !== null}
        onOpenChange={(val) => !val && !pending && setEditingItem(null)}
      >
        <DialogContent className="max-w-sm p-6">
          <DialogTitle className="font-heading text-lg font-bold">
            Edit Commission Rate
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {editingItem?.restaurantName} &bull; {editingItem?.categoryName}
          </DialogDescription>

          <form onSubmit={handleSaveRate} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="commission-rate-input" className="text-xs font-semibold text-foreground">
                Commission per Delivered Item (₹)
              </label>
              <input
                id="commission-rate-input"
                type="number"
                min="0"
                step="1"
                value={newRateInput}
                onChange={(e) => setNewRateInput(e.target.value)}
                required
                className="h-10 rounded-xl border bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
              <p>
                <strong>Preservation Policy:</strong> Saving this rate sets it as active from now on.
                Previous orders will continue to calculate their commission using their respective historical rates.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                disabled={pending}
                className="h-9 rounded-full border border-border px-4 text-xs font-semibold hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                {pending && <Loader2 className="size-3.5 animate-spin" />}
                Save Rate
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
