import { NextResponse } from "next/server";
import { getAnalyticsBundle } from "@/lib/server/analyticsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bundle = await getAnalyticsBundle();
    return NextResponse.json(bundle, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analytics data processing error";
    return NextResponse.json(
      { error: "ANALYTICS_DATA_ERROR", message },
      { status: 500 }
    );
  }
}
