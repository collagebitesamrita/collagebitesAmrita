import type { AdminOrder } from "@/lib/data/admin";
import { formatRupees } from "@/lib/format";
import { OFFERS } from "@/lib/offers";
import { formatStoredMobile } from "@/lib/phone";
import { formatOrderNumber } from "./status";

/** "A1 Biryani Dum Biryani - 1" — the one way the admin side writes a line item (card, WhatsApp, copy).
 * A biryani given free by the offer reads "… - 1 (free)", so the restaurant knows too. */
export function itemLine(item: { dishName: string; quantity: number; isFree?: boolean }): string {
	return `${item.dishName} - ${item.quantity}${item.isFree ? " (free)" : ""}`;
}

/** "10% off" / "Free Single biryani" — the order's offer, for admin lines. */
export function offerLine(order: Pick<AdminOrder, "discountOffer" | "discountAmount">): string | null {
	if (!order.discountOffer) return null;
	return `${OFFERS[order.discountOffer].short}: -${formatRupees(order.discountAmount)}`;
}

/** Each dish on its own line with its price; the offer, then a total line when there's more than one dish or a discount. */
function itemLinesWithPrices(order: AdminOrder): string[] {
	const lines = order.items.map((i) => `${itemLine(i)} (${i.isFree ? "free" : formatRupees(i.subtotal)})`);
	const offer = offerLine(order);
	if (offer) lines.push(offer);
	if (order.items.length > 1 || offer) lines.push(`Total: ${formatRupees(order.totalAmount)}`);
	return lines;
}

/** The confirmation the admin sends from an order card's WhatsApp button. */
export function whatsAppConfirmation(order: AdminOrder): string {
	return [
		`Hi ${order.studentName}, this is College Bites, confirming your order ${formatOrderNumber(order.dailyNumber)}`,
		`from ${order.restaurantName}:`,
		...itemLinesWithPrices(order),
		"Do you want to go ahead with this order? Reply yes to confirm.",
	].join("\n");
}

/** The message sent to the restaurant to confirm the order with them. */
export function whatsAppRestaurantConfirmation(order: AdminOrder): string {
	const lines = [
		`New order ${formatOrderNumber(order.dailyNumber)} from College Bites:`,
		"",
		`Student: ${order.studentName}`,
		`Phone: ${formatStoredMobile(order.contactPhone)}`,
		"",
		"Order:",
		...order.items.map((i) => ` • ${itemLine(i)}`),
	];
	if (order.notes) {
		lines.push("", `Note: "${order.notes}"`);
	}
	lines.push("", `Total: ${formatRupees(order.totalAmount)}`);
	return lines.join("\n");
}

/**
 * Checks whether an order is for Triangle Food Court.
 * Matches by restaurant name (case-insensitive) or known UUID,
 * ensuring it works regardless of database environment or newly generated UUIDs.
 */
export function isTriangleFoodCourt(order: AdminOrder): boolean {
	const name = (order.restaurantName ?? "").toLowerCase().trim();
	return name.includes("triangle") || order.restaurantId === "5b19f610-f3d7-4e82-bb06-d79abb36ffe4";
}

/**
 * The copy button's text: number, name, then restaurant and each dish — no
 * token or times. For Triangle Food Court only, each dish also carries its
 * price ("Dish - 1 (₹140)"), with the offer and total lines the WhatsApp message uses.
 */
export function orderDetailsText(order: AdminOrder): string {
	return [
		formatStoredMobile(order.contactPhone),
		order.studentName,
		order.restaurantName,
		...(isTriangleFoodCourt(order) ? itemLinesWithPrices(order) : order.items.map(itemLine)),
	].join("\n");
}
