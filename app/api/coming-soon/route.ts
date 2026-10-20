import { NextResponse } from "next/server";
import { getComingSoon } from "@/lib/mock-cinema";

export function GET() {
  return NextResponse.json(getComingSoon());
}
