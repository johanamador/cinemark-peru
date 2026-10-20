import { NextRequest, NextResponse } from "next/server"
import { getBillboard } from "@/lib/mock-cinema"

export const dynamic = "force-dynamic"

export function GET(req: NextRequest) {
  const data = getBillboard(req.nextUrl.searchParams.get("cinema_id") || "740")
  if (!data) return NextResponse.json({ error: "Cine no encontrado" }, { status: 404 })
  return NextResponse.json(data)
}
