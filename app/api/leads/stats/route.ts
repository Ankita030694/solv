import { NextResponse } from "next/server";
import { getLeadsStats } from "@/lib/services/leadsService";

export async function GET() {
  try {
    const stats = await getLeadsStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch stats";
    console.error("Error fetching leads stats:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

