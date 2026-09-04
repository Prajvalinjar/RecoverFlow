import { NextResponse } from "next/server";
import { fetchReconciliationList } from "@/lib/server/integrityService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchReconciliationList();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load reconciliation records";
    return NextResponse.json({ error: "RECONCILIATION_FETCH_ERROR", message }, { status: 500 });
  }
}
