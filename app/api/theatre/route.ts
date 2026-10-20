import { NextResponse } from "next/server";
import { getTheatres } from "@/lib/mock-cinema";

export function GET() {
  return NextResponse.json(getTheatres());
}
