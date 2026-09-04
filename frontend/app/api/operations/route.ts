import { NextResponse } from "next/server";
import { fetchOperationsOverview } from "@/lib/server/operationsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchOperationsOverview();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load operations overview";
    return NextResponse.json(
      { error: "OPERATIONS_FETCH_ERROR", message },
      { status: 500 }
    );
  }
}
