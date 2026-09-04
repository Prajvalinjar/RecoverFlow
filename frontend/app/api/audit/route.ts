import { NextResponse } from "next/server";
import { fetchAuditList } from "@/lib/server/integrityService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchAuditList();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load audit events";
    return NextResponse.json({ error: "AUDIT_FETCH_ERROR", message }, { status: 500 });
  }
}
