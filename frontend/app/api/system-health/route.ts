import { NextResponse } from "next/server";
import { fetchSystemHealth } from "@/lib/server/infrastructureService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchSystemHealth();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load system health";
    return NextResponse.json({ error: "SYSTEM_HEALTH_FETCH_ERROR", message }, { status: 500 });
  }
}
