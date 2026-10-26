/**
 * Every knob for the CollegeBites startup preloader.
 * Times are milliseconds from the moment it starts.
 */
export const SPLASH = {
	/** Minimum time the preloader stays on screen to let the full choreography play (in ms). */
	minMs: 3400,
	/** Maximum safety timeout: the preloader will always dismiss before this even if network hangs. */
	maxMs: 8000,
	/** Reduced motion: duration before fade out when prefers-reduced-motion is active. */
	reducedHoldMs: 700,
	/** Last resort (CSS): the splash hides itself after this no matter what. */
	failsafeMs: 9000,
	/** sessionStorage flag — plays once per browser session (each fresh app open, not per internal route). */
	sessionKey: "collegebites.splash-shown",
	/** localStorage key; set it to "off" to disable on one device. */
	disableKey: "collegebites.splash",
	/** Never on these paths (admin dashboard, OAuth callback, Google's review bot on legal pages). */
	skipPaths: ["/admin", "/auth", "/privacy", "/terms"],
} as const;

/** Build-time switch: NEXT_PUBLIC_DISABLE_SPLASH=1 removes the splash entirely (e.g. in .env.local while developing). */
export const SPLASH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1";
