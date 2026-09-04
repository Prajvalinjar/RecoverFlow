import { NextResponse } from "next/server";
import { fetchCaseDetail } from "@/lib/server/casesService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    if (!caseId) {
      return NextResponse.json({ error: "CASE_ID_REQUIRED" }, { status: 400 });
    }

    const caseBundle = await fetchCaseDetail(caseId);
    if (!caseBundle) {
      return NextResponse.json(
        { error: "CASE_NOT_FOUND", message: `Recovery case ${caseId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(caseBundle, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load case investigation";
    return NextResponse.json({ error: "CASE_INVESTIGATION_ERROR", message }, { status: 500 });
  }
}
