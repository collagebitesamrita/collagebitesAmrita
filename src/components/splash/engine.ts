/**
 * The CollegeBites startup preloader engine — runs as a raw inline script
 * before React hydrates, so the triple-curtain reveal fires with zero layout
 * flash. Everything it uses must live inside this function: no imports, no helpers
 * from module scope (because it gets serialized with runSplash.toString()).
 */

export type SplashRuntime = {
	minMs: number;
	maxMs: number;
	reducedHoldMs: number;
	loadTimeoutMs: number;
	sessionKey: string;
	disableKey: string;
	skipPaths: readonly string[];
};

export function runSplash(C: SplashRuntime): void {
	const html = document.documentElement;
	const setState = (s: string) => html.setAttribute("data-splash", s);

	// ---- Play this load? -----------------------------------------------
	try {
		const path = location.pathname;
		const query = location.search;
		for (const p of C.skipPaths) {
			if (path === p || path.indexOf(p + "/") === 0) return;
		}
		if (/[?&]nosplash(=|&|$)/.test(query)) return;
		if (localStorage.getItem(C.disableKey) === "off") return;
		if (document.visibilityState === "hidden") return;
	} catch {
		return;
	}

	setState("play");
	html.classList.add("cb-loading");

	const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
	const msgs = [
		"Warming up the handi…",
		"Packing your biryani…",
		"Adding the extra raita…",
		"Almost at your door!",
		"Pickup ready at Gate 3!",
	];

	let overlay: HTMLElement | null = null;
	let started = false;
	const t0 = Date.now();

	(function find() {
		const el = document.getElementById("app-splash");
		if (el && el.querySelector('[data-sp="end"]')) {
			overlay = el;
			try {
				start();
			} catch {
				setState("done");
				html.classList.remove("cb-loading");
				html.classList.add("cb-ready");
			}
			return;
		}
		if (Date.now() - t0 > C.loadTimeoutMs) {
			setState("done");
			html.classList.remove("cb-loading");
			html.classList.add("cb-ready");
			return;
		}
		setTimeout(find, 16);
	})();

	setTimeout(() => {
		if (!started) {
			setState("done");
			html.classList.remove("cb-loading");
			html.classList.add("cb-ready");
		}
	}, C.loadTimeoutMs);

	function start() {
		if (started || !overlay) return;
		started = true;
		setState("run");

		const rootEl = overlay;
		const fillEl = rootEl.querySelector<HTMLDivElement>("#cb-fill");
		const pctEl = rootEl.querySelector<HTMLSpanElement>("#cb-pct");
		const tipEl = rootEl.querySelector<HTMLParagraphElement>("#cb-tip");

		if (reduce) {
			rootEl.setAttribute("data-reduced", "");
			setTimeout(() => {
				setState("out");
				rootEl.classList.add("cb-done");
				setTimeout(() => {
					html.classList.remove("cb-loading");
					html.classList.add("cb-ready");
					setState("done");
				}, 400);
				setTimeout(() => {
					rootEl.remove();
					document.dispatchEvent(new CustomEvent("cb:preloader-done"));
				}, 900);
			}, C.reducedHoldMs);
			return;
		}

		let progress = 0;
		let finished = false;
		let mi = 0;
		const startT = performance.now();

		function setProgress(v: number) {
			if (fillEl) fillEl.style.setProperty("--p", v.toFixed(4));
			if (pctEl) pctEl.textContent = Math.round(v * 100) + "%";
		}

		const tipInterval = setInterval(() => {
			if (finished || !tipEl) return;
			mi = Math.min(mi + 1, msgs.length - 1);
			tipEl.classList.add("cb-swap");
			setTimeout(() => {
				if (tipEl) {
					tipEl.textContent = msgs[mi];
					tipEl.classList.remove("cb-swap");
				}
			}, 240);
			if (mi === msgs.length - 1) clearInterval(tipInterval);
		}, 1050);

		function finish() {
			if (finished) return;
			finished = true;
			clearInterval(tipInterval);
			setProgress(1);

			setTimeout(() => {
				setState("out");
				rootEl.classList.add("cb-done");
				setTimeout(() => {
					html.classList.remove("cb-loading");
					html.classList.add("cb-ready");
					setState("done");
				}, 750);
				setTimeout(() => {
					rootEl.remove();
					document.dispatchEvent(new CustomEvent("cb:preloader-done"));
				}, 2100);
			}, 400);
		}

		(function tick(now: number) {
			if (finished) return;
			const elapsed = now - startT;
			const x = Math.min(Math.max((elapsed - 1400) / (C.minMs - 1400), 0), 1);
			const eased = (1 - Math.cos(Math.PI * x)) / 2;
			progress += (eased - progress) * 0.16;
			setProgress(progress);

			if ((elapsed >= C.minMs && progress > 0.985) || elapsed >= C.maxMs) {
				return finish();
			}
			requestAnimationFrame(tick);
		})(startT);
	}
}
