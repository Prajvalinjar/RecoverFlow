import { NextResponse } from "next/server";
import { fetchProviderDetail } from "@/lib/server/infrastructureService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;
    if (!providerId) {
      return NextResponse.json({ error: "PROVIDER_ID_REQUIRED" }, { status: 400 });
    }

    const providerBundle = await fetchProviderDetail(providerId);
    if (!providerBundle) {
      return NextResponse.json(
        { error: "PROVIDER_NOT_FOUND", message: `Provider ${providerId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(providerBundle, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load provider detail";
    return NextResponse.json({ error: "PROVIDER_DETAIL_ERROR", message }, { status: 500 });
  }
}
