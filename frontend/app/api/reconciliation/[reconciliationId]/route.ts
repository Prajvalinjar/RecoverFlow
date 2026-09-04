import { NextResponse } from "next/server";
import { fetchReconciliationDetail } from "@/lib/server/integrityService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reconciliationId: string }> }
) {
  try {
    const { reconciliationId } = await params;
    if (!reconciliationId) {
      return NextResponse.json({ error: "RECONCILIATION_ID_REQUIRED" }, { status: 400 });
    }

    const recBundle = await fetchReconciliationDetail(reconciliationId);
    if (!recBundle) {
      return NextResponse.json(
        { error: "RECONCILIATION_NOT_FOUND", message: `Reconciliation record ${reconciliationId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(recBundle, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load reconciliation record";
    return NextResponse.json({ error: "RECONCILIATION_DETAIL_ERROR", message }, { status: 500 });
  }
}
