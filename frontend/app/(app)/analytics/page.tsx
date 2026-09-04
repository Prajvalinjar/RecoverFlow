import { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export const metadata: Metadata = {
  title: "Recovery Analytics — RecoverFlow",
  description: "Measure recovery performance, failure patterns, and execution efficiency.",
};

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
