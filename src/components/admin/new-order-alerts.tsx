"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, BellRing, Loader2, Volume2, VolumeX, Sparkle } from "@/components/icons";
import { adminPill } from "@/components/admin/styles";
import { enablePush, hasPushSubscription, pushState } from "@/lib/notifications/client";
import {
	armAdminAlertSound,
	isAdminAlertSoundEnabled,
	playAdminAlertSound,
	setAdminAlertSoundEnabled,
} from "@/lib/sound/play";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * Live new-order alerts on the dashboard:
 * 1. Supabase Realtime subscription on `orders` INSERT for instant alerts.
 * 2. Background polling fallback every 8 seconds in case Realtime drops or is throttled.
 * 3. Auto-arms Web Audio on any click/touch on the dashboard so alerts play reliably.
 * 4. Local Notification API for desktop/mobile banner popups.
 * 5. Changes tab title to alert the admin when tab is in background.
 */
export function NewOrderAlerts() {
	const router = useRouter();
	const [pushOn, setPushOn] = useState(false);
	const [armed, setArmed] = useState(false);
	const [soundOn, setSoundOn] = useState(true);
	const [newCount, setNewCount] = useState(0);
	const [blocked, setBlocked] = useState(false);
	const [pending, startTransition] = useTransition();

	const armedRef = useRef(false);
	const seenOrderIds = useRef<Set<string>>(new Set());
	const initialFetchDone = useRef(false);
	const originalTitle = useRef<string>("");

	// Store original title
	useEffect(() => {
		if (typeof document !== "undefined") {
			originalTitle.current = document.title || "Dashboard · College Bites Admin";
		}
	}, []);

	// Auto-arm audio on any user interaction with the dashboard
	useEffect(() => {
		const autoArm = () => {
			armAdminAlertSound();
			armedRef.current = true;
			setArmed(true);
		};
		window.addEventListener("pointerdown", autoArm, { passive: true });
		window.addEventListener("keydown", autoArm, { passive: true });
		return () => {
			window.removeEventListener("pointerdown", autoArm);
			window.removeEventListener("keydown", autoArm);
		};
	}, []);

	// Clear title badge when user focuses the tab
	useEffect(() => {
		const onFocus = () => {
			if (typeof document !== "undefined" && originalTitle.current) {
				document.title = originalTitle.current;
			}
		};
		window.addEventListener("focus", onFocus);
		return () => window.removeEventListener("focus", onFocus);
	}, []);

	// Initial push & sound state check
	useEffect(() => {
		let alive = true;
		(async () => {
			const has = await hasPushSubscription();
			if (!alive) return;
			setSoundOn(isAdminAlertSoundEnabled());
			setPushOn(has);
			setBlocked(pushState() === "denied" || pushState() === "unsupported");
		})();
		return () => {
			alive = false;
		};
	}, []);

	// Unified handler when a new order arrives
	const handleIncomingOrder = (dailyNumber?: number) => {
		setNewCount((n) => n + 1);
		playAdminAlertSound();

		const numStr = dailyNumber ? ` #${dailyNumber}` : "";
		toast.success(`🔔 New order${numStr} just came in!`);

		// Native browser notification if allowed
		if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
			try {
				new Notification(`🔔 New Order${numStr}!`, {
					body: "A new order just arrived on College Bites. Tap to view.",
					icon: "/icon-192.png",
				});
			} catch {}
		}

		// Flash tab title if document is in background
		if (typeof document !== "undefined" && document.hidden) {
			document.title = `(1) 🔔 New Order! · College Bites Admin`;
		}

		router.refresh();
	};

	// 1. Supabase Realtime subscription
	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel("admin-new-orders")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "orders" },
				(payload) => {
					const order = payload.new as { id?: string; daily_number?: number };
					if (order?.id) {
						if (seenOrderIds.current.has(order.id)) return;
						seenOrderIds.current.add(order.id);
					}
					handleIncomingOrder(order?.daily_number);
				},
			)
			.subscribe((status) => {
				console.log("[Admin Realtime Orders]:", status);
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [router]);

	// 2. Background polling fallback every 8 seconds (covers websocket drops/throttles)
	useEffect(() => {
		const supabase = createClient();
		let intervalId: NodeJS.Timeout;

		const checkRecentOrders = async () => {
			try {
				const { data } = await supabase
					.from("orders")
					.select("id, daily_number, created_at")
					.order("created_at", { ascending: false })
					.limit(10);

				if (!data) return;

				if (!initialFetchDone.current) {
					data.forEach((o) => seenOrderIds.current.add(o.id));
					initialFetchDone.current = true;
					return;
				}

				for (const order of data) {
					if (!seenOrderIds.current.has(order.id)) {
						seenOrderIds.current.add(order.id);
						handleIncomingOrder(order.daily_number);
					}
				}
			} catch {
				// Polling fails silently
			}
		};

		checkRecentOrders();
		intervalId = setInterval(checkRecentOrders, 8000);

		return () => clearInterval(intervalId);
	}, []);

	function turnOn() {
		armAdminAlertSound();
		armedRef.current = true;
		setArmed(true);

		startTransition(async () => {
			// Also request local Notification permission if supported
			if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
				try {
					await Notification.requestPermission();
				} catch {}
			}

			const result = await enablePush();
			if (result.ok) {
				setPushOn(true);
				playAdminAlertSound();
				toast.success("Alerts & notifications are on. That's how a new order will sound!");
			} else {
				// Even if web push service fails, local sound + in-tab notifications are active
				playAdminAlertSound();
				toast.success("Sound alerts are active! (Web push note: " + result.error + ")");
			}
		});
	}

	function testSound() {
		armAdminAlertSound();
		armedRef.current = true;
		setArmed(true);
		playAdminAlertSound();
		toast.success("Playing alert sound!");
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onClick={turnOn}
				disabled={pending}
				className={cn(adminPill, pushOn && armed && "border-success text-success")}
			>
				{pending ? (
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
				) : pushOn && armed ? (
					<BellRing className="size-4" aria-hidden="true" />
				) : (
					<Bell className="size-4" aria-hidden="true" />
				)}
				{pushOn && armed ? "Alerts on" : "Turn on alerts"}
			</button>

			<button
				type="button"
				onClick={() => {
					const next = !soundOn;
					setAdminAlertSoundEnabled(next);
					setSoundOn(next);
					if (next) {
						armAdminAlertSound();
						armedRef.current = true;
						setArmed(true);
						playAdminAlertSound();
					}
				}}
				aria-pressed={soundOn}
				className={adminPill}
				aria-label={soundOn ? "Mute alert sound" : "Unmute alert sound"}
			>
				{soundOn ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
				{soundOn ? "Sound on" : "Muted"}
			</button>

			<button
				type="button"
				onClick={testSound}
				className={cn(adminPill, "text-muted-foreground hover:text-foreground")}
				title="Test how a new order sounds"
			>
				<Sparkle className="size-4" aria-hidden="true" />
				Test sound
			</button>

			{newCount > 0 && (
				<button
					type="button"
					onClick={() => {
						setNewCount(0);
						if (typeof document !== "undefined" && originalTitle.current) {
							document.title = originalTitle.current;
						}
						router.refresh();
					}}
					className={cn(adminPill, "border-primary bg-primary/10 text-primary")}
				>
					<BellOff className="size-4" aria-hidden="true" />
					{newCount} new {newCount === 1 ? "order" : "orders"} · tap to clear
				</button>
			)}
		</div>
	);
}
