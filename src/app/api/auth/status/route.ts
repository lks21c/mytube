import { NextResponse } from "next/server";
import { getAuthStatus } from "@/lib/innertube";

export async function GET() {
  return NextResponse.json(getAuthStatus());
}
