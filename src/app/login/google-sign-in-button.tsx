"use client";

import { useState } from "react";
import { Loader2 } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function signIn() {
		setPending(true);
		setError(null);
		const supabase = createClient();
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
				queryParams: { prompt: "select_account" },
			},
		});
		// On success the browser is already navigating to Google.
		if (error) {
			setError("Couldn't reach Google. Check your connection and try again.");
			setPending(false);
		}
	}

	return (
		<div className="flex w-full flex-col gap-3">
			<button
				type="button"
				onClick={signIn}
				disabled={pending}
				className="group relative flex h-14 w-full items-center justify-center gap-3.5 rounded-full border border-black/10 bg-white text-base font-semibold text-neutral-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.2)] active:scale-[0.98] outline-none transition-all duration-200 focus-visible:ring-3 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-75"
			>
				{/* Subtle shine on hover */}
				<div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

				{pending ? (
					<Loader2 className="size-5.5 animate-spin text-neutral-700" />
				) : (
					<GoogleIcon />
				)}
				<span className="font-medium tracking-tight">
					{pending ? "Opening Google…" : "Continue with Google"}
				</span>
			</button>
			{error && (
				<p role="alert" className="text-center text-sm font-medium text-red-600 mt-1">
					{error}
				</p>
			)}
		</div>
	);
}

function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" className="size-5 shrink-0 transition-transform group-hover:scale-105" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
			/>
			<path
				fill="#34A853"
				d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
			/>
			<path
				fill="#FBBC05"
				d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z"
			/>
			<path
				fill="#EA4335"
				d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
			/>
		</svg>
	);
}
