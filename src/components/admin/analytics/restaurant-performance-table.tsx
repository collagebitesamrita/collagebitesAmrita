"use client";

import { Storefront } from "@/components/icons";
import type { RestaurantPerformanceRow } from "@/lib/data/analytics-types";
import { cn } from "@/lib/utils";

type RestaurantPerformanceTableProps = {
  performance: RestaurantPerformanceRow[];
};

export function RestaurantPerformanceTable({ performance }: RestaurantPerformanceTableProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4">
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">
            Restaurant Performance
          </h2>
          <p className="text-xs text-muted-foreground">
            Delivered orders, collections, items, and profit per partner restaurant
          </p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-orange-200/80 bg-orange-50 text-orange-600">
          <Storefront className="size-4" aria-hidden="true" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 pr-4">Restaurant</th>
              <th className="py-2.5 px-4 text-center">Delivered Orders</th>
              <th className="py-2.5 px-4 text-center">Items Sold</th>
              <th className="py-2.5 px-4 text-right">Collections</th>
              <th className="py-2.5 px-4 text-right">Profit</th>
              <th className="py-2.5 px-4 text-right">Avg Order Value</th>
              <th className="py-2.5 pl-4 text-right">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {performance.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                  No restaurant data available for this range.
                </td>
              </tr>
            ) : (
              performance.map((row) => (
                <tr key={row.restaurantId} className="transition-colors hover:bg-muted/30">
                  {/* Restaurant name with status dot */}
                  <td className="py-3 pr-4 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full shrink-0",
                          row.isActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                        )}
                        aria-hidden="true"
                        title={row.isActive ? "Active" : "Paused"}
                      />
                      <span className="truncate">{row.restaurantName}</span>
                    </div>
                  </td>

                  {/* Delivered Orders */}
                  <td className="py-3 px-4 text-center font-semibold text-foreground">
                    {row.deliveredOrders}
                  </td>

                  {/* Items Sold */}
                  <td className="py-3 px-4 text-center font-semibold text-foreground">
                    {row.itemsSold}
                  </td>

                  {/* Collections */}
                  <td className="py-3 px-4 text-right font-medium text-foreground">
                    ₹{row.collections.toLocaleString("en-IN")}
                  </td>

                  {/* Profit */}
                  <td className="py-3 px-4 text-right font-semibold text-orange-600">
                    ₹{row.profit.toLocaleString("en-IN")}
                  </td>

                  {/* Avg Order Value */}
                  <td className="py-3 px-4 text-right text-muted-foreground">
                    {row.avgOrderValue > 0 ? `₹${row.avgOrderValue.toLocaleString("en-IN")}` : "—"}
                  </td>

                  {/* Share */}
                  <td className="py-3 pl-4 text-right">
                    <span className="inline-block rounded-full bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {row.sharePercentage}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
