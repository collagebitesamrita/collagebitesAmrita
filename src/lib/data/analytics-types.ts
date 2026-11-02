import { istDayKey } from "@/lib/date";

export type DateFilterType = "today" | "custom_date" | "custom_range";

export type KpiKey =
  | "total_collected"
  | "delivered_orders"
  | "commission_profit"
  | "orders_placed"
  | "items_sold";

export type KpiMetric = {
  calculatedValue: number;
  adjustment: number;
  finalValue: number;
};

export type CategoryCommissionRow = {
  restaurantId: string;
  restaurantName: string;
  categoryName: string;
  deliveredQuantity: number;
  rate: number;
  commission: number;
};

export type KpiAdjustmentRecord = {
  id: string;
  kpiKey: KpiKey;
  restaurantId: string | null;
  restaurantScope: string;
  startDate: string;
  endDate: string;
  calculatedValue: number;
  adjustmentAmount: number;
  finalValue: number;
  reason: string;
  adminId: string;
  adminName: string;
  createdAt: string;
  isActive: boolean;
};

export type CommissionRateEntry = {
  id?: string;
  restaurantId: string;
  categoryName: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  updatedAt?: string;
};

export type RestaurantCommissionConfig = {
  restaurantId: string;
  restaurantName: string;
  categories: {
    categoryName: string;
    rate: number;
    updatedAt: string | null;
  }[];
};

export type RestaurantPerformanceRow = {
  restaurantId: string;
  restaurantName: string;
  isActive: boolean;
  deliveredOrders: number;
  itemsSold: number;
  collections: number;
  profit: number;
  avgOrderValue: number;
  sharePercentage: number;
};

export type DeliveredOrderLogRow = {
  id: string;
  orderNumber: string;
  timeFormatted: string;
  studentName: string;
  restaurantName: string;
  itemsSummary: string;
  collectedAmount: number;
  commissionProfit: number;
  status: string;
};

export type AnalyticsDashboardData = {
  dateFilter: DateFilterType;
  startDate: string;
  endDate: string;
  activeRangeLabel: string;
  selectedRestaurantId: string; // 'all' or restaurant UUID
  restaurants: { id: string; name: string; isActive?: boolean }[];
  kpis: {
    totalCollected: KpiMetric;
    deliveredOrders: KpiMetric;
    commissionProfit: KpiMetric;
    ordersPlaced: KpiMetric;
    itemsSold: KpiMetric;
  };
  categoryBreakdown: CategoryCommissionRow[];
  totalEligibleDeliveredItems: number;
  totalCalculatedCommission: number;
  totalManualProfitAdjustment: number;
  finalCommissionProfit: number;
  restaurantPerformance: RestaurantPerformanceRow[];
  deliveredOrdersLog: DeliveredOrderLogRow[];
  adjustments: KpiAdjustmentRecord[];
  commissionConfigs: RestaurantCommissionConfig[];
  auditLog: KpiAdjustmentRecord[];
};

// Initial default rates for Biryani Nation (Clg Bites Biryani Nation)
export const BIRYANI_NATION_INITIAL_RATES: Record<string, number> = {
  Fulls: 40,
  Half: 20,
  Singles: 20,
  Starters: 30,
  Chinese: 10,
};

/**
 * Returns the current date formatted as YYYY-MM-DD in Asia/Kolkata (IST).
 */
export function getTodayISTString(): string {
  return istDayKey(new Date().toISOString());
}
