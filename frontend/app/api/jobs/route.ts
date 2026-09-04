import { NextResponse } from "next/server";
import { fetchJobsList } from "@/lib/server/jobsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchJobsList();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load jobs";
    return NextResponse.json({ error: "JOBS_FETCH_ERROR", message }, { status: 500 });
  }
}
