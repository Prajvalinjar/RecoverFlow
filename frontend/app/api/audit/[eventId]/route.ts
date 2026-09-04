import { NextResponse } from "next/server";
import { fetchAuditDetail } from "@/lib/server/integrityService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });
    }

    const eventBundle = await fetchAuditDetail(eventId);
    if (!eventBundle) {
      return NextResponse.json(
        { error: "EVENT_NOT_FOUND", message: `Audit event ${eventId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(eventBundle, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load audit event detail";
    return NextResponse.json({ error: "EVENT_DETAIL_ERROR", message }, { status: 500 });
  }
}
