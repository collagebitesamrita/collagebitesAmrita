import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ShieldCheck, MapPin, Clock } from "@/components/icons";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { GoogleSignInButton } from "./google-sign-in-button";
import "./login-v2.css";

export const metadata: Metadata = {
	title: SITE_TITLE,
	alternates: { canonical: "/login" },
};

const STRUCTURED_DATA = JSON.stringify({
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Organization",
			name: SITE_NAME,
			url: SITE_URL,
			logo: `${SITE_URL}/icons/icon-512`,
			description: SITE_DESCRIPTION,
			areaServed: "Amrita University AP, Amaravati, Andhra Pradesh, India",
		},
		{ "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
	],
}).replace(/</g, "\\u003c");

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
	const { error } = await searchParams;

	return (
		<main className="login-v2 relative flex w-full flex-1 flex-col overflow-hidden bg-[#FAFAF8]">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />

			{/* Atmospheric background layers */}
			<div aria-hidden="true" className="absolute inset-0">
				{/* Base gradient */}
				<div className="absolute inset-0 bg-gradient-to-b from-[#FAFAF8] via-[#F5F3EF] to-[#FAFAF8]" />
				{/* Warm spotlight from top */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,140,66,0.08),transparent)]" />
				{/* Subtle grain texture */}
				<div className="login-v2-grain absolute inset-0 opacity-[0.02]" />
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-1 flex-col items-center px-5 pt-12 pb-8 sm:pt-16">
				{/* Hero food photo with spotlight glow */}
				<div className="login-v2-hero relative mb-8">
					{/* Outer glow rings */}
					<div className="absolute inset-0 -m-4 rounded-full bg-[radial-gradient(circle,rgba(255,140,66,0.15),transparent_70%)] blur-2xl" />
					<div className="absolute inset-0 -m-8 rounded-full bg-[radial-gradient(circle,rgba(255,140,66,0.08),transparent_60%)] blur-3xl" />

					{/* Photo container */}
					<div className="relative size-44 overflow-hidden rounded-full border-2 border-white shadow-[0_20px_60px_-15px_rgba(255,140,66,0.3)] sm:size-52">
						<Image
							src="/photos/dishes/chicken-dum-biryani.jpg"
							alt="Chicken Dum Biryani"
							fill
							sizes="208px"
							priority
							className="object-cover"
						/>
						{/* Inner vignette */}
						<div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_50%,rgba(250,250,248,0.4))]" />
					</div>

					{/* Decorative ring */}
					<div className="absolute inset-0 -m-2 rounded-full border border-amber-500/10" />
				</div>

				{/* Brand mark */}
				<div className="login-v2-rise mb-5 flex items-center gap-3" style={{ "--rise-delay": "0.2s" } as CSSProperties}>
					<BrandLogo className="size-10 rounded-xl" />
					<span className="font-heading text-lg font-bold tracking-tight text-[#1A1D27]">College Bites</span>
				</div>

				{/* Headline */}
				<h1 className="login-v2-rise mb-3 text-center font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-[#1A1D27] sm:text-5xl" style={{ "--rise-delay": "0.35s" } as CSSProperties}>
					Hot food,
					<br />
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
						right now.
					</span>
				</h1>

				{/* Tagline */}
				<p className="login-v2-rise mb-8 max-w-xs text-center text-base text-[#6B6B73] sm:text-lg" style={{ "--rise-delay": "0.5s" } as CSSProperties}>
					Biryani, noodles & cravings from campus kitchens — delivered to Gate 3.
				</p>

				{/* Quick info pills */}
				<div className="login-v2-rise mb-8 flex flex-wrap items-center justify-center gap-3" style={{ "--rise-delay": "0.6s" } as CSSProperties}>
					<span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#1A1D27]/80 shadow-sm border border-[#1A1D27]/5">
						<MapPin className="size-3.5 text-amber-600" />
						Gate 3 delivery
					</span>
					<span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#1A1D27]/80 shadow-sm border border-[#1A1D27]/5">
						<Clock className="size-3.5 text-amber-600" />
						30-45 min
					</span>
				</div>

				{/* Spacer to push card down */}
				<div className="flex-1" />

				{/* Sign-in card */}
				<div className="login-v2-rise w-full max-w-sm" style={{ "--rise-delay": "0.75s" } as CSSProperties}>
					<div className="rounded-3xl border border-[#1A1D27]/10 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] sm:p-7">
						{error && (
							<div
								role="alert"
								className="mb-5 flex items-center gap-2.5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
							>
								<ShieldCheck className="size-5 shrink-0" />
								<span>Sign-in didn&apos;t work. Try again?</span>
							</div>
						)}

						<GoogleSignInButton />

						<p className="mt-5 text-center text-xs text-[#6B6B73]">
							By continuing, you agree to our{" "}
							<Link href="/terms" className="font-medium text-[#1A1D27]/70 underline decoration-amber-500/40 underline-offset-4 hover:text-amber-600 transition-colors">
								Terms
							</Link>{" "}
							and{" "}
							<Link href="/privacy" className="font-medium text-[#1A1D27]/70 underline decoration-amber-500/40 underline-offset-4 hover:text-amber-600 transition-colors">
								Privacy
							</Link>
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
