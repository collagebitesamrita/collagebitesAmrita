import { SPLASH } from "./config";
import { runSplash, type SplashRuntime } from "./engine";

const runtime: SplashRuntime = {
	minMs: SPLASH.minMs,
	maxMs: SPLASH.maxMs,
	reducedHoldMs: SPLASH.reducedHoldMs,
	loadTimeoutMs: SPLASH.failsafeMs,
	sessionKey: SPLASH.sessionKey,
	disableKey: SPLASH.disableKey,
	skipPaths: SPLASH.skipPaths,
};

/**
 * The preloader engine as a raw inline script (layout.tsx renders it with
 * dangerouslySetInnerHTML at the top of <body> — not next/script, whose
 * beforeInteractive inline scripts are queued until Next's JS loads).
 * `runSplash.toString()` is the compiled function source, so engine.ts
 * must stay self-contained. `?nosplash` skips it for one load; `?intro`
 * (or `?splash`) replays it.
 */
export const SPLASH_INIT_SCRIPT = `(${runSplash.toString()})(${JSON.stringify(runtime)});`;
