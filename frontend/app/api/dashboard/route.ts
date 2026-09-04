import { NextResponse } from "next/server";
import { fetchRawBackendData } from "@/lib/server/backendClient";
import { transformBackendBundle } from "@/lib/server/dashboardTransformer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawBundle = await fetchRawBackendData();
    const dashboardData = transformBackendBundle(rawBundle);

    return NextResponse.json(dashboardData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Dashboard data processing error";
    return NextResponse.json(
      { error: "DASHBOARD_DATA_ERROR", message },
      { status: 500 }
    );
  }
}
