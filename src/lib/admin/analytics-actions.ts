"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminActionResult } from "@/lib/admin/actions";
import type { KpiKey } from "@/lib/data/analytics-types";

/**
 * Gate every analytics action by checking admin role.
 */
async function assertAdmin() {
  const { profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false as const, error: "Admins only." };
  }
  return { ok: true as const, profile };
}

/**
 * Saves a manual KPI adjustment to Supabase with full audit tracking.
 */
export async function saveKpiAdjustment(data: {
  kpiKey: KpiKey;
  restaurantId: string | null;
  restaurantScope: string;
  startDate: string;
  endDate: string;
  calculatedValue: number;
  adjustmentAmount: number;
  reason: string;
}): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  // Validate reason
  const cleanReason = data.reason?.trim();
  if (!cleanReason || cleanReason.length < 3) {
    return { ok: false, error: "A valid reason (at least 3 characters) is required for all adjustments." };
  }

  // Validate adjustment numbers
  if (typeof data.adjustmentAmount !== "number" || isNaN(data.adjustmentAmount)) {
    return { ok: false, error: "Adjustment amount must be a valid number." };
  }

  // Validate count-based KPIs
  if (data.kpiKey === "delivered_orders" || data.kpiKey === "orders_placed" || data.kpiKey === "items_sold") {
    if (!Number.isInteger(data.adjustmentAmount)) {
      return { ok: false, error: "Count-based KPIs accept whole-number adjustments only." };
    }
    const finalCount = data.calculatedValue + data.adjustmentAmount;
    if (finalCount < 0) {
      return { ok: false, error: `The final displayed count cannot be below zero (Calculated: ${data.calculatedValue}, Adjustment: ${data.adjustmentAmount}).` };
    }
  }

  const finalValue = Math.round((data.calculatedValue + data.adjustmentAmount) * 100) / 100;

  const adminClient = createAdminClient();
  const supabase = adminClient ?? (await createClient());

  try {
    const { error } = await supabase.from("kpi_adjustments").insert({
      kpi_key: data.kpiKey,
      restaurant_id: data.restaurantId || null,
      restaurant_scope: data.restaurantScope || (data.restaurantId ? "Restaurant" : "ALL"),
      start_date: data.startDate,
      end_date: data.endDate,
      calculated_value: data.calculatedValue,
      adjustment_amount: data.adjustmentAmount,
      final_value: finalValue,
      reason: cleanReason,
      admin_id: auth.profile.id,
      admin_name: auth.profile.full_name || auth.profile.email,
      is_active: true,
    });

    if (error) {
      console.error("saveKpiAdjustment database error:", error);
      return {
        ok: false,
        error: error.message || "Could not save adjustment to the database. Please ensure migrations are applied.",
      };
    }
  } catch (err: unknown) {
    console.error("saveKpiAdjustment exception:", err);
    return { ok: false, error: "An unexpected error occurred while saving the adjustment." };
  }

  revalidatePath("/admin/analytics");
  return { ok: true };
}

/**
 * Reverses or removes an active KPI adjustment.
 */
export async function revertKpiAdjustment(adjustmentId: string, revertReason?: string): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const adminClient = createAdminClient();
  const supabase = adminClient ?? (await createClient());

  try {
    const { error } = await supabase
      .from("kpi_adjustments")
      .update({
        is_active: false,
        reason: revertReason ? `[REVERSED: ${revertReason}]` : undefined,
      })
      .eq("id", adjustmentId);

    if (error) {
      console.error("revertKpiAdjustment error:", error);
      return { ok: false, error: error.message || "Failed to revert adjustment." };
    }
  } catch (err: unknown) {
    console.error("revertKpiAdjustment exception:", err);
    return { ok: false, error: "Failed to revert adjustment." };
  }

  revalidatePath("/admin/analytics");
  return { ok: true };
}

/**
 * Updates a commission rate for a specific restaurant and category.
 * Preserves historical reports by retiring the current rate (setting effective_to = now())
 * and creating a new rate row effective from now.
 */
export async function updateCommissionRate(data: {
  restaurantId: string;
  categoryName: string;
  newRate: number;
}): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (typeof data.newRate !== "number" || isNaN(data.newRate) || data.newRate < 0) {
    return { ok: false, error: "Commission rate must be a non-negative number." };
  }

  const cleanCategory = data.categoryName.trim();
  if (!cleanCategory) {
    return { ok: false, error: "Category name is required." };
  }

  const now = new Date().toISOString();
  const adminClient = createAdminClient();
  const supabase = adminClient ?? (await createClient());

  try {
    // 1. Retire existing active rate for this restaurant + category
    await supabase
      .from("commission_rates")
      .update({ effective_to: now, updated_at: now, updated_by: auth.profile.id })
      .eq("restaurant_id", data.restaurantId)
      .ilike("category_name", cleanCategory)
      .is("effective_to", null);

    // 2. Insert new active rate
    const { error: insertErr } = await supabase.from("commission_rates").insert({
      restaurant_id: data.restaurantId,
      category_name: cleanCategory,
      rate: data.newRate,
      effective_from: now,
      effective_to: null,
      updated_by: auth.profile.id,
      updated_at: now,
    });

    if (insertErr) {
      console.error("updateCommissionRate insert error:", insertErr);
      return {
        ok: false,
        error: insertErr.message || "Could not save the new commission rate. Ensure database migrations are applied.",
      };
    }
  } catch (err: unknown) {
    console.error("updateCommissionRate exception:", err);
    return { ok: false, error: "Failed to update commission rate." };
  }

  revalidatePath("/admin/analytics");
  return { ok: true };
}

/**
 * Batch updates multiple commission rates.
 */
export async function batchUpdateCommissionRates(
  rates: { restaurantId: string; categoryName: string; newRate: number }[],
): Promise<AdminActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  for (const item of rates) {
    const res = await updateCommissionRate(item);
    if (!res.ok) return res;
  }

  revalidatePath("/admin/analytics");
  return { ok: true };
}
