import { NextResponse } from "next/server";
import { fetchPaymentDetail } from "@/lib/server/paymentsService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    if (!paymentId) {
      return NextResponse.json({ error: "PAYMENT_ID_REQUIRED" }, { status: 400 });
    }

    const paymentBundle = await fetchPaymentDetail(paymentId);
    if (!paymentBundle) {
      return NextResponse.json(
        { error: "PAYMENT_NOT_FOUND", message: `Payment transaction ${paymentId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(paymentBundle, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load payment investigation";
    return NextResponse.json({ error: "PAYMENT_INVESTIGATION_ERROR", message }, { status: 500 });
  }
}
