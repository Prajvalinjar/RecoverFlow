import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "RecoverFlow — Autonomous Revenue Recovery",
  description:
    "RecoverFlow detects failed payments, applies deterministic recovery policy, executes controlled recovery actions, and verifies the outcome.",
  openGraph: {
    title: "RecoverFlow — Autonomous Revenue Recovery",
    description:
      "RecoverFlow detects failed payments, applies deterministic recovery policy, executes controlled recovery actions, and verifies the outcome.",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingPageClient />;
}
