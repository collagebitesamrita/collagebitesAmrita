"use client";

import { useState, useMemo } from "react";
import { Search } from "@/components/icons";
import type { DeliveredOrderLogRow } from "@/lib/data/analytics-types";

type DeliveredOrdersLogTableProps = {
  orders: DeliveredOrderLogRow[];
};

export function DeliveredOrdersLogTable({ orders }: DeliveredOrdersLogTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.studentName.toLowerCase().includes(q) ||
        o.restaurantName.toLowerCase().includes(q) ||
        o.itemsSummary.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
      {/* Header and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">
            Delivered Orders Log ({filteredOrders.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Real order-by-order records contributing to collections and profit
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, student, dish..."
            className="w-full rounded-full border border-border/80 bg-background pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 pr-4">Order</th>
              <th className="py-2.5 px-4">Time</th>
              <th className="py-2.5 px-4">Student</th>
              <th className="py-2.5 px-4">Restaurant</th>
              <th className="py-2.5 px-4 min-w-[200px]">Items Delivered</th>
              <th className="py-2.5 px-4 text-right">Collected</th>
              <th className="py-2.5 px-4 text-right">Profit</th>
              <th className="py-2.5 pl-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                  {searchQuery ? "No delivered orders match your search." : "No delivered orders found in this period."}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-muted/30">
                  {/* Order Number */}
                  <td className="py-3 pr-4 font-mono text-xs font-semibold text-foreground">
                    {order.orderNumber}
                  </td>

                  {/* Time */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                    {order.timeFormatted}
                  </td>

                  {/* Student */}
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                    {order.studentName}
                  </td>

                  {/* Restaurant */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                    {order.restaurantName}
                  </td>

                  {/* Items Delivered */}
                  <td className="py-3 px-4 text-xs text-foreground">
                    <span className="line-clamp-2" title={order.itemsSummary}>
                      {order.itemsSummary}
                    </span>
                  </td>

                  {/* Collected */}
                  <td className="py-3 px-4 text-right font-medium text-foreground">
                    ₹{order.collectedAmount.toLocaleString("en-IN")}
                  </td>

                  {/* Profit */}
                  <td className="py-3 px-4 text-right font-semibold text-orange-600">
                    ₹{order.commissionProfit.toLocaleString("en-IN")}
                  </td>

                  {/* Status */}
                  <td className="py-3 pl-4 text-center">
                    <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {order.status}
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
