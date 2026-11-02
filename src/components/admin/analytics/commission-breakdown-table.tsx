"use client";

import { Fragment, useMemo } from "react";
import type { CategoryCommissionRow } from "@/lib/data/analytics-types";
import { cn } from "@/lib/utils";

type CommissionBreakdownTableProps = {
  breakdown: CategoryCommissionRow[];
  totalEligibleItems: number;
  totalCalculatedCommission: number;
  manualProfitAdjustment: number;
  finalCommissionProfit: number;
  selectedRestaurantScope: string;
};

export function CommissionBreakdownTable({
  breakdown,
  totalEligibleItems,
  totalCalculatedCommission,
  manualProfitAdjustment,
  finalCommissionProfit,
  selectedRestaurantScope,
}: CommissionBreakdownTableProps) {
  // Group rows by restaurant if multiple restaurants are represented
  const groupedByRestaurant = useMemo(() => {
    const map = new Map<string, { restaurantName: string; rows: CategoryCommissionRow[] }>();
    for (const row of breakdown) {
      if (!map.has(row.restaurantId)) {
        map.set(row.restaurantId, { restaurantName: row.restaurantName, rows: [] });
      }
      map.get(row.restaurantId)!.rows.push(row);
    }
    return Array.from(map.values());
  }, [breakdown]);

  const hasMultipleRestaurants = groupedByRestaurant.length > 1;

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
          Category-Wise Commission Breakdown
        </h2>
        <p className="text-xs text-muted-foreground">
          Delivered item quantities multiplied by applicable commission rates ({selectedRestaurantScope}).
        </p>
      </div>

      {breakdown.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center rounded-2xl bg-secondary/30 text-center">
          <p className="text-sm font-semibold text-muted-foreground">No delivered items in this date range.</p>
          <p className="text-xs text-muted-foreground/75 mt-0.5">
            Commission profit applies exclusively to completed, delivered orders.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/50">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-border/50 bg-secondary/50 font-bold text-muted-foreground">
              <tr>
                {hasMultipleRestaurants && <th className="px-4 py-3">Restaurant</th>}
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Delivered Quantity</th>
                <th className="px-4 py-3 text-right">Commission Rate</th>
                <th className="px-4 py-3 text-right">Calculated Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {groupedByRestaurant.map((group) => {
                const subtotalQty = group.rows.reduce((sum, r) => sum + r.deliveredQuantity, 0);
                const subtotalComm = group.rows.reduce((sum, r) => sum + r.commission, 0);

                return (
                  <Fragment key={`group-${group.restaurantName}`}>
                    {group.rows.map((row) => (
                      <tr
                        key={`${row.restaurantId}-${row.categoryName}`}
                        className="transition hover:bg-secondary/20"
                      >
                        {hasMultipleRestaurants && (
                          <td className="px-4 py-2.5 font-medium text-muted-foreground">
                            {row.restaurantName}
                          </td>
                        )}
                        <td className="px-4 py-2.5 font-semibold text-foreground flex items-center gap-1.5">
                          <span>{row.categoryName}</span>
                          {row.categoryName === "Half" && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                              New
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                          {row.deliveredQuantity.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                          ₹{row.rate.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground tabular-nums">
                          ₹{row.commission.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}

                    {/* Subtotal row for this restaurant if multiple restaurants exist */}
                    {hasMultipleRestaurants && (
                      <tr className="bg-secondary/20 font-semibold text-xs border-b border-border/40">
                        <td className="px-4 py-2 text-primary">{group.restaurantName} Subtotal</td>
                        <td className="px-4 py-2 text-muted-foreground">All Categories</td>
                        <td className="px-4 py-2 text-right tabular-nums">{subtotalQty.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                        <td className="px-4 py-2 text-right text-primary font-bold tabular-nums">
                          ₹{subtotalComm.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            {/* Grand Summary Footer */}
            <tfoot className="border-t-2 border-border/80 bg-secondary/40 font-bold">
              <tr>
                <td
                  colSpan={hasMultipleRestaurants ? 2 : 1}
                  className="px-4 py-3 font-heading text-sm text-foreground"
                >
                  Total Eligible Delivered Items & Calculated Commission
                </td>
                <td className="px-4 py-3 text-right font-heading text-sm text-foreground tabular-nums">
                  {totalEligibleItems.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground text-xs">—</td>
                <td className="px-4 py-3 text-right font-heading text-sm text-primary tabular-nums">
                  ₹{totalCalculatedCommission.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Commission Summary Cards */}
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-secondary/40 p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Calculated Commission</p>
          <p className="font-heading text-xl font-bold text-foreground tabular-nums">
            ₹{totalCalculatedCommission.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-2xl bg-secondary/40 p-3 text-center">
          <p className="text-xs text-muted-foreground">Manual Profit Adjustment</p>
          <p
            className={cn(
              "font-heading text-xl font-bold tabular-nums",
              manualProfitAdjustment > 0 && "text-emerald-600 dark:text-emerald-400",
              manualProfitAdjustment < 0 && "text-rose-600 dark:text-rose-400",
              manualProfitAdjustment === 0 && "text-muted-foreground",
            )}
          >
            {manualProfitAdjustment > 0
              ? `+₹${manualProfitAdjustment.toLocaleString("en-IN")}`
              : manualProfitAdjustment < 0
              ? `-₹${Math.abs(manualProfitAdjustment).toLocaleString("en-IN")}`
              : "₹0"}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-center">
          <p className="text-xs font-semibold text-primary">Final Displayed Commission Profit</p>
          <p className="font-heading text-2xl font-black text-primary tabular-nums">
            ₹{finalCommissionProfit.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </section>
  );
}
