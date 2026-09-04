import { NextResponse } from "next/server";
import { fetchWorkersList } from "@/lib/server/infrastructureService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchWorkersList();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load workers";
    return NextResponse.json({ error: "WORKERS_FETCH_ERROR", message }, { status: 500 });
  }
}
