import { ViewTransition } from "react";
import { CartBar } from "@/components/cart/cart-bar";
import { HomeHeader } from "@/components/home/home-header";
import { OrderingPausedBanner } from "@/components/home/ordering-paused-banner";
import { RestaurantList } from "@/components/home/restaurant-list";
import { SignInWelcomeToast } from "@/components/home/sign-in-welcome-toast";
import { ThursdayNudge } from "@/components/home/thursday-nudge";
import { getRestaurantMenuStats, getRestaurants, getSearchableDishes, getThursdaySpecial } from "@/lib/data/restaurants";
import { getOrderingState } from "@/lib/data/settings";
import { getOffers } from "@/lib/data/offers";
import { getDishOrderCounts, getTrendingDishes } from "@/lib/data/trending";
import { getRatePromptOrder } from "@/lib/data/orders";
import { RatePrompt } from "@/components/home/rate-prompt";
import { FinishProfileNudge } from "@/components/taste/finish-profile-nudge";
import { TasteSheetHost } from "@/components/taste/taste-sheet";
import { getLikedDishes } from "@/lib/data/favorites";
import { getTasteProfile, hasPlacedOrder } from "@/lib/data/taste";
import { answeredCount, cravingOrder, heartCravings, EMPTY_TASTE } from "@/lib/taste/options";
import { getTimeOfDayIST, isThursdayIST } from "@/lib/date";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { getSessionProfile } from "@/lib/profile";

export default async function Home({ searchParams }: PageProps<"/">) {
	const { signedIn } = await searchParams;
	// Anonymous browsing — profile may be null for unsigned visitors.
	const profilePromise = getSessionProfile();
	const restaurantsPromise = getRestaurants();
	const menuStatsPromise = getRestaurantMenuStats();
	const dishesPromise = getSearchableDishes();
	const orderingPromise = getOrderingState();
	const offersPromise = getOffers();
	const trendingDishesPromise = getTrendingDishes();
	const dishOrderCountsPromise = getDishOrderCounts();
	const thursdaySpecialPromise = isThursdayIST() ? getThursdaySpecial() : Promise.resolve(null);

	const { profile } = await profilePromise;
	const [restaurants, menuStats, dishes, ordering, thursdaySpecial, trendingDishes, dishOrderCounts, offers] = await Promise.all([
		restaurantsPromise,
		menuStatsPromise,
		dishesPromise,
		orderingPromise,
		thursdaySpecialPromise,
		trendingDishesPromise,
		dishOrderCountsPromise,
		offersPromise,
	]);

	// Profile-dependent data — only fetched when signed in.
	let ratePrompt = null;
	let taste = EMPTY_TASTE;
	let placedOrder = false;
	let liked: Awaited<ReturnType<typeof getLikedDishes>> = [];
	let fromHearts: string[] = [];
	if (profile) {
		const [rp, tp, po, lk] = await Promise.all([
			getRatePromptOrder(profile.id),
			getTasteProfile(profile.id),
			hasPlacedOrder(profile.id),
			getLikedDishes(profile.id),
		]);
		ratePrompt = rp;
		taste = tp;
		placedOrder = po;
		liked = lk;
		fromHearts = heartCravings(liked);
	}

	const timeOfDay = getTimeOfDayIST();
	const orderingEnabled = ordering.open;
	const isSignedIn = !!profile;

	return (
		<main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
			{isSignedIn && <SignInWelcomeToast justSignedIn={signedIn === "1"} />}
			{isSignedIn && ratePrompt && <RatePrompt order={ratePrompt} />}
			{isSignedIn && <TasteSheetHost taste={taste} fromHearts={fromHearts} />}
			{isSignedIn && placedOrder && answeredCount(taste) < 3 && <FinishProfileNudge taste={taste} />}
			<ViewTransition {...NAV_TRANSITION}>
				<ViewTransition {...REVEAL_ENTER}>
					<HomeHeader fullName={profile?.full_name ?? "Guest"} timeOfDay={timeOfDay} avatar={taste.avatar} isSignedIn={isSignedIn} />
					{thursdaySpecial && <ThursdayNudge special={thursdaySpecial} />}
					{!orderingEnabled && <OrderingPausedBanner ordering={ordering} />}
					<RestaurantList
						restaurants={restaurants}
						orderingEnabled={orderingEnabled}
						closedChip={ordering.short}
						closedLine={ordering.headline}
						menuStats={menuStats}
						dishes={dishes}
						dishOrderCounts={dishOrderCounts}
						trendingDishes={trendingDishes}
						cravings={isSignedIn ? cravingOrder(taste, fromHearts) : []}
					/>
				</ViewTransition>
			</ViewTransition>
			<CartBar
				profilePhone={profile?.phone ?? null}
				orderingEnabled={orderingEnabled}
				closedNote={ordering.headline}
				spiceLevel={taste.spiceLevel}
				offers={offers}
				hasTabBar
			/>
		</main>
	);
}
