import { NextResponse } from "next/server";
import { fetchProvidersList } from "@/lib/server/infrastructureService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchProvidersList();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load providers";
    return NextResponse.json({ error: "PROVIDERS_FETCH_ERROR", message }, { status: 500 });
  }
}
