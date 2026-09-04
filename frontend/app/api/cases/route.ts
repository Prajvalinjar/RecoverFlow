import { NextResponse } from "next/server";
import { fetchCasesList } from "@/lib/server/casesService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchCasesList();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load cases";
    return NextResponse.json({ error: "CASES_FETCH_ERROR", message }, { status: 500 });
  }
}
