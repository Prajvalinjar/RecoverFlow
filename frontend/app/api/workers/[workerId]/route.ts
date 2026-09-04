import { NextResponse } from "next/server";
import { fetchWorkerDetail } from "@/lib/server/infrastructureService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const { workerId } = await params;
    if (!workerId) {
      return NextResponse.json({ error: "WORKER_ID_REQUIRED" }, { status: 400 });
    }

    const workerBundle = await fetchWorkerDetail(workerId);
    if (!workerBundle) {
      return NextResponse.json(
        { error: "WORKER_NOT_FOUND", message: `Worker node ${workerId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(workerBundle, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load worker detail";
    return NextResponse.json({ error: "WORKER_DETAIL_ERROR", message }, { status: 500 });
  }
}
