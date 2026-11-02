import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatTime } from "@/lib/date";

import {
  type DateFilterType,
  type KpiKey,
  type CategoryCommissionRow,
  type KpiAdjustmentRecord,
  type CommissionRateEntry,
  type RestaurantCommissionConfig,
  type RestaurantPerformanceRow,
  type DeliveredOrderLogRow,
  type AnalyticsDashboardData,
  BIRYANI_NATION_INITIAL_RATES,
  getTodayISTString,
} from "./analytics-types";

export * from "./analytics-types";

/**
 * Converts a YYYY-MM-DD date range in IST to UTC ISO strings covering the full range.
 * Start: YYYY-MM-DD 00:00:00.000 IST
 * End:   YYYY-MM-DD 23:59:59.999 IST (including the entire end day)
 */
export function getISTUtcRange(startDateStr: string, endDateStr: string): { startIso: string; endIso: string } {
  const [startY, startM, startD] = startDateStr.split("-").map(Number);
  const [endY, endM, endD] = endDateStr.split("-").map(Number);

  // IST offset is UTC+5:30 -> subtract 330 minutes to get UTC instant
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

  // Start instant: YYYY-MM-DD 00:00:00.000 IST
  const startUtc = new Date(Date.UTC(startY, startM - 1, startD, 0, 0, 0, 0) - IST_OFFSET_MS);

  // End instant: YYYY-MM-DD 23:59:59.999 IST
  const endUtc = new Date(Date.UTC(endY, endM - 1, endD, 23, 59, 59, 999) - IST_OFFSET_MS);

  return {
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
  };
}

/**
 * Formats a YYYY-MM-DD date string as "1 Nov 2026"
 */
function formatISTDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[(m || 1) - 1]} ${y}`;
}

/**
 * Categorizes an item for Biryani Nation based on its dish name and raw category.
 * Rules:
 * - Title has "(Half)" -> Half (₹20)
 * - Title has "(Full)" -> Fulls (₹40)
 * - Title has "(Single)" -> Singles (₹20)
 * - Category contains "starter" -> Starters (₹30)
 * - Category contains "chinese" or "fried rice" -> Chinese (₹10)
 */
export function categorizeBiryaniNationItem(dishName: string, categoryName: string | null): string {
  const name = dishName || "";
  const lowerName = name.toLowerCase();
  const lowerCat = (categoryName || "").toLowerCase();
  const lowerDish = lowerName;

  // 1. Explicit portion checks in title take highest precedence
  if (lowerName.includes("(half)") || lowerName.includes(" half")) {
    return "Half";
  }
  if (lowerName.includes("(full)") || lowerName.includes(" full")) {
    return "Fulls";
  }
  if (lowerName.includes("(single)") || lowerName.includes(" single")) {
    return "Singles";
  }

  // 2. Biryani dishes without explicit tag default to Fulls
  if (lowerDish.includes("biryani") || lowerCat.includes("biryani")) {
    return "Fulls";
  }

  // 3. Starters check (category contains 'starter' or dish is known starter)
  if (lowerCat.includes("starter") || lowerDish.includes("tikka") || lowerDish.includes("kebab") || lowerDish.includes("65")) {
    return "Starters";
  }

  // 4. Chinese check (category 'Chinese' or 'Fried Rice')
  if (lowerCat.includes("chinese") || lowerCat.includes("fried rice") || lowerDish.includes("fried rice") || lowerDish.includes("noodles")) {
    return "Chinese";
  }

  return categoryName || "Other";
}

/**
 * Fetches all analytics data for the admin analytics dashboard.
 */
export async function getAnalyticsDashboardData(params?: {
  dateFilter?: DateFilterType;
  startDate?: string;
  endDate?: string;
  restaurantId?: string;
}): Promise<AnalyticsDashboardData> {
  const adminClient = createAdminClient();
  const supabase = adminClient ?? (await createClient());

  // Determine active date filter and dates
  const todayStr = getTodayISTString();
  const dateFilter: DateFilterType = params?.dateFilter ?? "today";

  let startDate = todayStr;
  let endDate = todayStr;

  if (dateFilter === "custom_date" && params?.startDate) {
    startDate = params.startDate;
    endDate = params.startDate;
  } else if (dateFilter === "custom_range" && params?.startDate && params?.endDate) {
    startDate = params.startDate;
    endDate = params.endDate;
    // Ensure start <= end
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }
  }

  const { startIso, endIso } = getISTUtcRange(startDate, endDate);
  const selectedRestaurantId = params?.restaurantId && params.restaurantId !== "all" ? params.restaurantId : "all";

  // Build activeRangeLabel e.g. "Today (1 Nov 2026)" or "1 Nov 2026 – 2 Nov 2026"
  let activeRangeLabel = "";
  if (startDate === endDate) {
    if (startDate === todayStr) {
      activeRangeLabel = `Today (${formatISTDateLabel(startDate)})`;
    } else {
      activeRangeLabel = formatISTDateLabel(startDate);
    }
  } else {
    activeRangeLabel = `${formatISTDateLabel(startDate)} – ${formatISTDateLabel(endDate)}`;
  }

  // 1. Fetch Restaurants
  const { data: rawRestaurants } = await supabase
    .from("restaurants")
    .select("id, name, is_active")
    .order("name");

  const restaurants = (rawRestaurants ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    isActive: Boolean(r.is_active),
  }));

  const restaurantMap = new Map<string, string>();
  for (const r of restaurants) {
    restaurantMap.set(r.id, r.name);
  }

  // 2. Fetch Dish Categories and Dishes for category mapping
  const { data: rawCategories } = await supabase
    .from("dish_categories")
    .select("id, restaurant_id, name")
    .order("sort_order");

  const categoryNameMap = new Map<string, string>();
  for (const c of rawCategories ?? []) {
    categoryNameMap.set(c.id, c.name);
  }

  const { data: rawDishes } = await supabase
    .from("dishes")
    .select("id, restaurant_id, category_id, name");

  const dishCategoryMap = new Map<string, string>();
  const dishRestaurantMap = new Map<string, string>();
  for (const d of rawDishes ?? []) {
    dishRestaurantMap.set(d.id, d.restaurant_id);
    if (d.category_id && categoryNameMap.has(d.category_id)) {
      dishCategoryMap.set(d.id, categoryNameMap.get(d.category_id)!);
    }
  }

  // 3. Fetch Orders in range (filter by restaurant if specified)
  let ordersQuery = supabase
    .from("orders")
    .select("id, restaurant_id, status, total_amount, created_at, delivered_at, daily_number, contact_phone, user_id, users(full_name)")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false });

  if (selectedRestaurantId !== "all") {
    ordersQuery = ordersQuery.eq("restaurant_id", selectedRestaurantId);
  }

  const { data: orders } = await ordersQuery;
  const safeOrders = orders ?? [];

  // Distinct order counts and calculations
  const calculatedOrdersPlaced = safeOrders.length;
  let calculatedDeliveredOrders = 0;
  let calculatedTotalCollected = 0;

  const deliveredOrderIds: string[] = [];
  const restaurantDeliveredCounts = new Map<string, number>();
  const restaurantCollections = new Map<string, number>();
  const restaurantDeliveredItems = new Map<string, number>();
  const restaurantProfit = new Map<string, number>();

  for (const r of restaurants) {
    restaurantDeliveredCounts.set(r.id, 0);
    restaurantCollections.set(r.id, 0);
    restaurantDeliveredItems.set(r.id, 0);
    restaurantProfit.set(r.id, 0);
  }

  for (const o of safeOrders) {
    if (o.status === "delivered") {
      calculatedDeliveredOrders++;
      const amt = Number(o.total_amount) || 0;
      calculatedTotalCollected += amt;
      deliveredOrderIds.push(o.id);

      const prevDel = restaurantDeliveredCounts.get(o.restaurant_id) || 0;
      restaurantDeliveredCounts.set(o.restaurant_id, prevDel + 1);

      const prevColl = restaurantCollections.get(o.restaurant_id) || 0;
      restaurantCollections.set(o.restaurant_id, prevColl + amt);
    }
  }

  // Account for deleted delivered orders from deleted_orders_log if available
  try {
    let deletedQuery = supabase
      .from("deleted_orders_log")
      .select("restaurant_id, status, total_amount, created_at")
      .gte("created_at", startIso)
      .lte("created_at", endIso);

    if (selectedRestaurantId !== "all") {
      deletedQuery = deletedQuery.eq("restaurant_id", selectedRestaurantId);
    }

    const { data: deletedOrders } = await deletedQuery;
    for (const d of deletedOrders ?? []) {
      if (d.status === "delivered") {
        calculatedDeliveredOrders = Math.max(0, calculatedDeliveredOrders - 1);
        calculatedTotalCollected = Math.max(0, calculatedTotalCollected - (Number(d.total_amount) || 0));
      }
    }
  } catch {
    // deleted_orders_log is optional; ignore if query not supported
  }

  // 4. Fetch Commission Rates
  let storedRates: CommissionRateEntry[] = [];
  try {
    const { data: rateRows, error: rateErr } = await supabase
      .from("commission_rates")
      .select("id, restaurant_id, category_name, rate, effective_from, effective_to, updated_at")
      .order("created_at", { ascending: false });

    if (!rateErr && rateRows) {
      storedRates = rateRows.map((row) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        categoryName: row.category_name,
        rate: Number(row.rate),
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
        updatedAt: row.updated_at,
      }));
    }
  } catch {
    // Commission rates table fallback to defaults
  }

  // Helper to find applicable commission rate for (restaurantId, categoryName, orderTimestamp)
  function getApplicableRate(rId: string, catName: string, orderTimestampIso: string): number {
    const rName = restaurantMap.get(rId) || "";
    const isBiryaniNation = rName.toLowerCase().includes("biryani nation");

    // Look for stored historical rate matching timestamp
    const matched = storedRates.find((entry) => {
      if (entry.restaurantId !== rId) return false;
      if (entry.categoryName.toLowerCase() !== catName.toLowerCase()) return false;
      const orderTime = new Date(orderTimestampIso).getTime();
      const fromTime = new Date(entry.effectiveFrom).getTime();
      const toTime = entry.effectiveTo ? new Date(entry.effectiveTo).getTime() : Infinity;
      return orderTime >= fromTime && orderTime < toTime;
    });

    if (matched) return matched.rate;

    // Latest active stored rate fallback
    const latestActive = storedRates.find((entry) => {
      return entry.restaurantId === rId && entry.categoryName.toLowerCase() === catName.toLowerCase() && !entry.effectiveTo;
    });

    if (latestActive) return latestActive.rate;

    // If Biryani Nation and not yet configured, use initial default rates
    if (isBiryaniNation) {
      return BIRYANI_NATION_INITIAL_RATES[catName] ?? 0;
    }

    return 0;
  }

  // 5. Fetch Delivered Order Items for Commission Calculations
  type AggregatedCategoryData = {
    restaurantId: string;
    restaurantName: string;
    categoryName: string;
    quantity: number;
    commission: number;
    effectiveRate: number;
  };

  const categoryAggregations = new Map<string, AggregatedCategoryData>();
  const orderItemsSummaryMap = new Map<string, string[]>();
  const orderItemsProfitMap = new Map<string, number>();

  let calculatedCommissionProfit = 0;
  let totalEligibleDeliveredItems = 0;

  if (deliveredOrderIds.length > 0) {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("order_id, dish_id, dish_name, quantity, created_at")
      .in("order_id", deliveredOrderIds);

    const orderDateMap = new Map<string, { restaurantId: string; createdAt: string }>();
    for (const o of safeOrders) {
      orderDateMap.set(o.id, { restaurantId: o.restaurant_id, createdAt: o.created_at });
    }

    for (const item of orderItems ?? []) {
      const orderInfo = orderDateMap.get(item.order_id);
      if (!orderInfo) continue;

      const rId = orderInfo.restaurantId;
      const rName = restaurantMap.get(rId) || "Unknown Restaurant";
      const isBiryaniNation = rName.toLowerCase().includes("biryani nation");

      const rawCategory = (item.dish_id && dishCategoryMap.get(item.dish_id)) || null;

      let catName: string;
      if (isBiryaniNation) {
        catName = categorizeBiryaniNationItem(item.dish_name, rawCategory);
      } else {
        catName = rawCategory || "General Menu";
      }

      const qty = item.quantity || 1;
      const rate = getApplicableRate(rId, catName, item.created_at || orderInfo.createdAt);
      const itemCommission = qty * rate;

      totalEligibleDeliveredItems += qty;
      calculatedCommissionProfit += itemCommission;

      const prevItems = restaurantDeliveredItems.get(rId) || 0;
      restaurantDeliveredItems.set(rId, prevItems + qty);

      const prevProf = restaurantProfit.get(rId) || 0;
      restaurantProfit.set(rId, prevProf + itemCommission);

      // Group per order for order log
      const prevSummary = orderItemsSummaryMap.get(item.order_id) || [];
      prevSummary.push(qty > 1 ? `${qty}× ${item.dish_name}` : item.dish_name);
      orderItemsSummaryMap.set(item.order_id, prevSummary);

      const prevOrderProf = orderItemsProfitMap.get(item.order_id) || 0;
      orderItemsProfitMap.set(item.order_id, prevOrderProf + itemCommission);

      const aggKey = `${rId}::${catName}`;
      const existing = categoryAggregations.get(aggKey);
      if (existing) {
        existing.quantity += qty;
        existing.commission += itemCommission;
        existing.effectiveRate = rate;
      } else {
        categoryAggregations.set(aggKey, {
          restaurantId: rId,
          restaurantName: rName,
          categoryName: catName,
          quantity: qty,
          commission: itemCommission,
          effectiveRate: rate,
        });
      }
    }
  }

  // Ensure default Biryani Nation categories are always represented if Biryani Nation or ALL is selected
  const biryaniNation = restaurants.find((r) => r.name.toLowerCase().includes("biryani nation"));
  if (biryaniNation && (selectedRestaurantId === "all" || selectedRestaurantId === biryaniNation.id)) {
    const requiredBnCategories = ["Fulls", "Half", "Singles", "Starters", "Chinese"];
    for (const cat of requiredBnCategories) {
      const aggKey = `${biryaniNation.id}::${cat}`;
      if (!categoryAggregations.has(aggKey)) {
        categoryAggregations.set(aggKey, {
          restaurantId: biryaniNation.id,
          restaurantName: biryaniNation.name,
          categoryName: cat,
          quantity: 0,
          commission: 0,
          effectiveRate: getApplicableRate(biryaniNation.id, cat, new Date().toISOString()),
        });
      }
    }
  }

  // Ensure other restaurants' categories appear if that restaurant is selected
  if (selectedRestaurantId !== "all" && biryaniNation && selectedRestaurantId !== biryaniNation.id) {
    const otherRestCats = (rawCategories ?? []).filter((c) => c.restaurant_id === selectedRestaurantId);
    for (const c of otherRestCats) {
      const aggKey = `${selectedRestaurantId}::${c.name}`;
      if (!categoryAggregations.has(aggKey)) {
        categoryAggregations.set(aggKey, {
          restaurantId: selectedRestaurantId,
          restaurantName: restaurantMap.get(selectedRestaurantId) || "",
          categoryName: c.name,
          quantity: 0,
          commission: 0,
          effectiveRate: getApplicableRate(selectedRestaurantId, c.name, new Date().toISOString()),
        });
      }
    }
  }

  // Convert category breakdown to array and sort
  const categoryBreakdown: CategoryCommissionRow[] = Array.from(categoryAggregations.values()).map((c) => ({
    restaurantId: c.restaurantId,
    restaurantName: c.restaurantName,
    categoryName: c.categoryName,
    deliveredQuantity: c.quantity,
    rate: c.effectiveRate,
    commission: c.commission,
  }));

  const bnOrder = ["Fulls", "Half", "Singles", "Starters", "Chinese"];
  categoryBreakdown.sort((a, b) => {
    if (a.restaurantId === b.restaurantId) {
      const idxA = bnOrder.indexOf(a.categoryName);
      const idxB = bnOrder.indexOf(b.categoryName);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.categoryName.localeCompare(b.categoryName);
    }
    return a.restaurantName.localeCompare(b.restaurantName);
  });

  // 6. Fetch Manual Adjustments
  let allActiveAdjustments: KpiAdjustmentRecord[] = [];
  let recentAuditLog: KpiAdjustmentRecord[] = [];

  try {
    const { data: adjRows, error: adjErr } = await supabase
      .from("kpi_adjustments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!adjErr && adjRows) {
      recentAuditLog = adjRows.map((r) => ({
        id: r.id,
        kpiKey: r.kpi_key as KpiKey,
        restaurantId: r.restaurant_id,
        restaurantScope: r.restaurant_scope,
        startDate: r.start_date,
        endDate: r.end_date,
        calculatedValue: Number(r.calculated_value),
        adjustmentAmount: Number(r.adjustment_amount),
        finalValue: Number(r.final_value),
        reason: r.reason,
        adminId: r.admin_id,
        adminName: r.admin_name,
        createdAt: r.created_at,
        isActive: r.is_active,
      }));

      // Active adjustments overlapping selected date range
      allActiveAdjustments = recentAuditLog.filter((adj) => {
        if (!adj.isActive) return false;
        return adj.startDate <= endDate && adj.endDate >= startDate;
      });
    }
  } catch {
    // kpi_adjustments fallback
  }

  // Filter adjustments based on selected restaurant scope
  const applicableAdjustments = allActiveAdjustments.filter((adj) => {
    if (selectedRestaurantId === "all") {
      return true;
    }
    return adj.restaurantId === selectedRestaurantId;
  });

  // Sum adjustments per KPI
  let adjCollected = 0;
  let adjDelivered = 0;
  let adjProfit = 0;
  let adjOrdersPlaced = 0;
  let adjItemsSold = 0;

  for (const adj of applicableAdjustments) {
    if (adj.kpiKey === "total_collected") adjCollected += adj.adjustmentAmount;
    if (adj.kpiKey === "delivered_orders") adjDelivered += adj.adjustmentAmount;
    if (adj.kpiKey === "commission_profit") adjProfit += adj.adjustmentAmount;
    if (adj.kpiKey === "orders_placed") adjOrdersPlaced += adj.adjustmentAmount;
    if (adj.kpiKey === "items_sold") adjItemsSold += adj.adjustmentAmount;
  }

  // Calculate final displayed values
  const finalCollected = Math.round((calculatedTotalCollected + adjCollected) * 100) / 100;
  const finalDelivered = Math.max(0, Math.round(calculatedDeliveredOrders + adjDelivered));
  const finalProfit = Math.round((calculatedCommissionProfit + adjProfit) * 100) / 100;
  const finalOrdersPlaced = Math.max(0, Math.round(calculatedOrdersPlaced + adjOrdersPlaced));
  const finalItemsSold = Math.max(0, Math.round(totalEligibleDeliveredItems + adjItemsSold));

  // 7. Prepare Commission Configuration View for each restaurant
  const commissionConfigs: RestaurantCommissionConfig[] = [];

  for (const rest of restaurants) {
    const isBn = rest.name.toLowerCase().includes("biryani nation");
    let categoryList: string[] = [];

    if (isBn) {
      categoryList = ["Fulls", "Half", "Singles", "Starters", "Chinese"];
    } else {
      categoryList = (rawCategories ?? [])
        .filter((c) => c.restaurant_id === rest.id)
        .map((c) => c.name);
      if (categoryList.length === 0) {
        categoryList = ["General Menu"];
      }
    }

    const categoriesWithRates = categoryList.map((catName) => {
      const activeStored = storedRates.find(
        (r) => r.restaurantId === rest.id && r.categoryName.toLowerCase() === catName.toLowerCase() && !r.effectiveTo,
      );

      let currentRate = 0;
      if (activeStored) {
        currentRate = activeStored.rate;
      } else if (isBn) {
        currentRate = BIRYANI_NATION_INITIAL_RATES[catName] ?? 0;
      }

      return {
        categoryName: catName,
        rate: currentRate,
        updatedAt: activeStored?.updatedAt ?? null,
      };
    });

    commissionConfigs.push({
      restaurantId: rest.id,
      restaurantName: rest.name,
      categories: categoriesWithRates,
    });
  }

  // 8. Build Restaurant Performance table
  const restaurantPerformance: RestaurantPerformanceRow[] = restaurants.map((r) => {
    const delOrders = restaurantDeliveredCounts.get(r.id) || 0;
    const items = restaurantDeliveredItems.get(r.id) || 0;
    const coll = restaurantCollections.get(r.id) || 0;
    const prof = restaurantProfit.get(r.id) || 0;
    const avgOrderVal = delOrders > 0 ? Math.round(coll / delOrders) : 0;
    const share = calculatedTotalCollected > 0 ? Math.round((coll / calculatedTotalCollected) * 100) : 0;

    return {
      restaurantId: r.id,
      restaurantName: r.name,
      isActive: r.isActive ?? true,
      deliveredOrders: delOrders,
      itemsSold: items,
      collections: coll,
      profit: prof,
      avgOrderValue: avgOrderVal,
      sharePercentage: share,
    };
  });

  // Sort restaurant performance: Biryani Nation first, then by collections descending, then name
  restaurantPerformance.sort((a, b) => {
    const aIsBn = a.restaurantName.toLowerCase().includes("biryani nation");
    const bIsBn = b.restaurantName.toLowerCase().includes("biryani nation");
    if (aIsBn && !bIsBn) return -1;
    if (!aIsBn && bIsBn) return 1;
    if (b.collections !== a.collections) return b.collections - a.collections;
    return a.restaurantName.localeCompare(b.restaurantName);
  });

  // 9. Build Delivered Orders Log
  const deliveredOrdersLog: DeliveredOrderLogRow[] = safeOrders
    .filter((o) => o.status === "delivered")
    .map((o) => {
      const rawUsers = o.users as unknown;
      const userObj = (Array.isArray(rawUsers) ? rawUsers[0] : rawUsers) as { full_name?: string } | null;
      const studentName = userObj?.full_name || o.contact_phone || "Student";
      const restaurantName = restaurantMap.get(o.restaurant_id) || "Restaurant";
      const timeFormatted = formatTime(o.created_at);
      const itemsSummary = orderItemsSummaryMap.get(o.id)?.join(", ") || "Dishes delivered";
      const orderProfit = orderItemsProfitMap.get(o.id) || 0;
      const orderNum = o.daily_number ? `#${o.daily_number}` : `#${o.id.slice(0, 6).toUpperCase()}`;

      return {
        id: o.id,
        orderNumber: orderNum,
        timeFormatted,
        studentName,
        restaurantName,
        itemsSummary,
        collectedAmount: Number(o.total_amount) || 0,
        commissionProfit: orderProfit,
        status: "Delivered",
      };
    });

  return {
    dateFilter,
    startDate,
    endDate,
    activeRangeLabel,
    selectedRestaurantId,
    restaurants,
    kpis: {
      totalCollected: {
        calculatedValue: calculatedTotalCollected,
        adjustment: adjCollected,
        finalValue: finalCollected,
      },
      deliveredOrders: {
        calculatedValue: calculatedDeliveredOrders,
        adjustment: adjDelivered,
        finalValue: finalDelivered,
      },
      commissionProfit: {
        calculatedValue: calculatedCommissionProfit,
        adjustment: adjProfit,
        finalValue: finalProfit,
      },
      ordersPlaced: {
        calculatedValue: calculatedOrdersPlaced,
        adjustment: adjOrdersPlaced,
        finalValue: finalOrdersPlaced,
      },
      itemsSold: {
        calculatedValue: totalEligibleDeliveredItems,
        adjustment: adjItemsSold,
        finalValue: finalItemsSold,
      },
    },
    categoryBreakdown,
    totalEligibleDeliveredItems,
    totalCalculatedCommission: calculatedCommissionProfit,
    totalManualProfitAdjustment: adjProfit,
    finalCommissionProfit: finalProfit,
    restaurantPerformance,
    deliveredOrdersLog,
    adjustments: applicableAdjustments,
    commissionConfigs,
    auditLog: recentAuditLog.slice(0, 50),
  };
}
