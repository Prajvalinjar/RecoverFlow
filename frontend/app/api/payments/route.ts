import { NextResponse } from "next/server";
import { fetchPaymentsList } from "@/lib/server/paymentsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchPaymentsList();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load payments";
    return NextResponse.json({ error: "PAYMENTS_FETCH_ERROR", message }, { status: 500 });
  }
}
