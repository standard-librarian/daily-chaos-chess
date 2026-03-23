import { NextRequest, NextResponse } from "next/server";

import { createSystemAdmin } from "@/infrastructure/auth/demo-auth";
import { getChaosChessService } from "@/infrastructure/container";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getChaosChessService().runDailyCutoff(createSystemAdmin());
  return NextResponse.json(result);
}
