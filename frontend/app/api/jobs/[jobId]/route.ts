import { NextResponse } from "next/server";
import { fetchJobDetail } from "@/lib/server/jobsService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "JOB_ID_REQUIRED" }, { status: 400 });
    }

    const jobBundle = await fetchJobDetail(jobId);
    if (!jobBundle) {
      return NextResponse.json(
        { error: "JOB_NOT_FOUND", message: `Recovery job ${jobId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(jobBundle, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load job investigation";
    return NextResponse.json({ error: "JOB_INVESTIGATION_ERROR", message }, { status: 500 });
  }
}
