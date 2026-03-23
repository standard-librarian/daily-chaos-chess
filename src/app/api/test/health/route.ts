import { NextResponse } from "next/server";

function isE2EModeEnabled() {
  return process.env.E2E_MODE === "1";
}

export async function GET() {
  if (!isE2EModeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
