import { NextResponse } from "next/server";
import { executeControlAction } from "@/lib/server/operationsService";
import { ControlActionRequest, SupportedControlAction } from "@/lib/types/operations";

export const dynamic = "force-dynamic";

const VALID_ACTIONS: Set<SupportedControlAction> = new Set([
  "PAUSE_RECOVERY",
  "RESUME_RECOVERY",
  "RECONCILE_QUEUE",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ControlActionRequest;

    if (!body || !body.action) {
      return NextResponse.json(
        { error: "ACTION_REQUIRED", message: "A valid control action is required." },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.has(body.action)) {
      return NextResponse.json(
        {
          error: "UNSUPPORTED_CONTROL_ACTION",
          message: `Control action '${body.action}' is not exposed or supported by the backend.`,
        },
        { status: 400 }
      );
    }

    const result = await executeControlAction(body.action);

    if (result.status === "FAILED") {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute control action";
    return NextResponse.json(
      { error: "CONTROL_EXECUTION_ERROR", message },
      { status: 500 }
    );
  }
}
