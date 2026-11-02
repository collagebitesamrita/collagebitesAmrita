"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Receipt,
  Utensils,
  TrendUp,
  ArrowsDownUp,
  PencilSimple,
} from "@/components/icons";
import { adminPill } from "@/components/admin/styles";
import { AnalyticsFilters } from "./analytics-filters";
import { KpiCard } from "./kpi-card";
import { KpiEditModal } from "./kpi-edit-modal";
import { RestaurantPerformanceTable } from "./restaurant-performance-table";
import { DeliveredOrdersLogTable } from "./delivered-orders-log-table";
import { CommissionConfigSection } from "./commission-config-section";
import { CommissionBreakdownTable } from "./commission-breakdown-table";
import { AdjustmentAuditLog } from "./adjustment-audit-log";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AnalyticsDashboardData, KpiKey } from "@/lib/data/analytics-types";

type AnalyticsViewProps = {
  data: AnalyticsDashboardData;
};

export function AnalyticsView({ data }: AnalyticsViewProps) {
  // State for active edit KPI modal
  const [activeEditKpi, setActiveEditKpi] = useState<{
    kpiKey: KpiKey;
    kpiTitle: string;
    isCurrency: boolean;
    isIntegerOnly: boolean;
    currentCalculated: number;
    currentAdjustment: number;
  } | null>(null);

  // Modals for Rates Configure and KPI Audit
  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header Row: Back button on left, Date filters on right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className={adminPill}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to dashboard</span>
        </Link>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-2">
          <AnalyticsFilters
            currentDateFilter={data.dateFilter}
            currentStartDate={data.startDate}
            currentEndDate={data.endDate}
            currentRestaurantId={data.selectedRestaurantId}
            restaurants={data.restaurants}
          />
        </div>
      </div>

      {/* Title & Subtitle Section */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Orders Analytics
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Track your collections, orders, items sold, and profit with manual adjustments & audit logging.
        </p>

        {/* Action Badges Row */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
          {/* Active Range Badge */}
          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50/80 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300 shadow-2xs">
            Active Range: <strong className="ml-1 font-bold">{data.activeRangeLabel}</strong>
          </span>

          {/* Profit Rates Button */}
          <button
            type="button"
            onClick={() => setRatesModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/90 bg-background px-3 py-1 text-xs font-medium text-foreground shadow-2xs hover:border-orange-400 hover:text-orange-600 transition-colors"
          >
            <ArrowsDownUp className="size-3 text-orange-500" aria-hidden="true" />
            <span>Profit Rates</span>
            <span className="text-muted-foreground">· Configure</span>
          </button>

          {/* Adjust KPIs / Audit Button */}
          <button
            type="button"
            onClick={() => setAuditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/90 bg-background px-3 py-1 text-xs font-medium text-foreground shadow-2xs hover:border-orange-400 hover:text-orange-600 transition-colors"
          >
            <PencilSimple className="size-3 text-orange-500" aria-hidden="true" />
            <span>Adjust KPIs</span>
            <span className="text-muted-foreground">· Audit</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Collections */}
        <KpiCard
          title="COLLECTIONS"
          subtitle="Delivered orders"
          calculatedValue={data.kpis.totalCollected.calculatedValue}
          adjustment={data.kpis.totalCollected.adjustment}
          finalValue={data.kpis.totalCollected.finalValue}
          isCurrency={true}
          icon={<Banknote className="size-4" aria-hidden="true" />}
          onEdit={() =>
            setActiveEditKpi({
              kpiKey: "total_collected",
              kpiTitle: "Total Collections",
              isCurrency: true,
              isIntegerOnly: false,
              currentCalculated: data.kpis.totalCollected.calculatedValue,
              currentAdjustment: data.kpis.totalCollected.adjustment,
            })
          }
        />

        {/* KPI 2: Total Profit (Highlighted Hero Card) */}
        <KpiCard
          title="TOTAL PROFIT"
          subtitle="Net Commission"
          calculatedValue={data.kpis.commissionProfit.calculatedValue}
          adjustment={data.kpis.commissionProfit.adjustment}
          finalValue={data.kpis.commissionProfit.finalValue}
          isCurrency={true}
          isHero={true}
          icon={<TrendUp className="size-4" aria-hidden="true" />}
          onEdit={() =>
            setActiveEditKpi({
              kpiKey: "commission_profit",
              kpiTitle: "Commission Profit",
              isCurrency: true,
              isIntegerOnly: false,
              currentCalculated: data.kpis.commissionProfit.calculatedValue,
              currentAdjustment: data.kpis.commissionProfit.adjustment,
            })
          }
          onConfigureRates={() => setRatesModalOpen(true)}
        />

        {/* KPI 3: Orders */}
        <KpiCard
          title="ORDERS"
          subtitle="Completed deliveries"
          calculatedValue={data.kpis.deliveredOrders.calculatedValue}
          adjustment={data.kpis.deliveredOrders.adjustment}
          finalValue={data.kpis.deliveredOrders.finalValue}
          isCurrency={false}
          icon={<Receipt className="size-4" aria-hidden="true" />}
          onEdit={() =>
            setActiveEditKpi({
              kpiKey: "delivered_orders",
              kpiTitle: "Delivered Orders",
              isCurrency: false,
              isIntegerOnly: true,
              currentCalculated: data.kpis.deliveredOrders.calculatedValue,
              currentAdjustment: data.kpis.deliveredOrders.adjustment,
            })
          }
        />

        {/* KPI 4: Items Sold */}
        <KpiCard
          title="ITEMS SOLD"
          subtitle="Dishes delivered"
          calculatedValue={data.kpis.itemsSold.calculatedValue}
          adjustment={data.kpis.itemsSold.adjustment}
          finalValue={data.kpis.itemsSold.finalValue}
          isCurrency={false}
          icon={<Utensils className="size-4" aria-hidden="true" />}
          onEdit={() =>
            setActiveEditKpi({
              kpiKey: "items_sold",
              kpiTitle: "Items Sold",
              isCurrency: false,
              isIntegerOnly: true,
              currentCalculated: data.kpis.itemsSold.calculatedValue,
              currentAdjustment: data.kpis.itemsSold.adjustment,
            })
          }
        />
      </div>

      {/* Table 1: Restaurant Performance */}
      <RestaurantPerformanceTable performance={data.restaurantPerformance} />

      {/* Table 2: Delivered Orders Log */}
      <DeliveredOrdersLogTable orders={data.deliveredOrdersLog} />

      {/* KPI Edit Modal */}
      {activeEditKpi && (
        <KpiEditModal
          open={Boolean(activeEditKpi)}
          onClose={() => setActiveEditKpi(null)}
          kpiKey={activeEditKpi.kpiKey}
          kpiTitle={activeEditKpi.kpiTitle}
          startDate={data.startDate}
          endDate={data.endDate}
          selectedRestaurantId={data.selectedRestaurantId}
          restaurants={data.restaurants}
          currentCalculated={activeEditKpi.currentCalculated}
          currentAdjustment={activeEditKpi.currentAdjustment}
          isCurrency={activeEditKpi.isCurrency}
          isIntegerOnly={activeEditKpi.isIntegerOnly}
        />
      )}

      {/* Profit Rates & Commission Configuration Modal */}
      <Dialog open={ratesModalOpen} onOpenChange={setRatesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl">
          <DialogTitle className="font-heading text-xl font-bold text-foreground">
            Commission Rates & Category Breakdown
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Configure commission per dish category for Biryani Nation (Fulls ₹40, Half ₹20, Singles ₹20, Starters ₹30, Chinese ₹10) and other partner restaurants. Changes preserve historical rate effectivity.
          </DialogDescription>

          <div className="mt-6 space-y-6">
            {/* Category Commission Breakdown Table */}
            <CommissionBreakdownTable
              breakdown={data.categoryBreakdown}
              totalEligibleItems={data.totalEligibleDeliveredItems}
              totalCalculatedCommission={data.totalCalculatedCommission}
              manualProfitAdjustment={data.totalManualProfitAdjustment}
              finalCommissionProfit={data.finalCommissionProfit}
              selectedRestaurantScope={
                data.selectedRestaurantId === "all"
                  ? "All Restaurants"
                  : data.restaurants.find((r) => r.id === data.selectedRestaurantId)?.name || "Restaurant"
              }
            />

            {/* Editable Rates Section */}
            <CommissionConfigSection configs={data.commissionConfigs} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust KPIs & Audit Log Modal */}
      <Dialog open={auditModalOpen} onOpenChange={setAuditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl">
          <DialogTitle className="font-heading text-xl font-bold text-foreground">
            KPI Adjustments & Audit History
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Immutable audit trail of all manual adjustments across Collections, Profit, Delivered Orders, and Items Sold.
          </DialogDescription>

          <div className="mt-6">
            <AdjustmentAuditLog auditLog={data.auditLog} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
