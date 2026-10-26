import "server-only";

import { createClient } from "@/lib/supabase/server";

type HighlyReorderedRow = {
 dish_id: string;
 dish_name: string;
 restaurant_id: string;
 restaurant_name: string;
 repeat_student_count: number;
};

/**
 * Dish IDs campus-wide where at least 3 distinct students have each
 * ordered it 3+ times — a genuine repeat-purchase signal, distinct from
 * trending_dishes()'s raw order-volume popularity. Powers the menu's
 * "Highly re-ordered" tag.
 */
export async function getHighlyReorderedDishIds(): Promise<Set<string>> {
 const supabase = await createClient();
 const { data, error } = await supabase.rpc("highly_reordered_dishes");

 if (error) {
 // Anonymous users can't call this RPC (granted to authenticated only).
 // Return empty rather than crashing the menu page for guests.
 console.error("getHighlyReorderedDishIds failed", error);
 return new Set();
 }
 return new Set(((data ?? []) as HighlyReorderedRow[]).map((d) => d.dish_id));
}
