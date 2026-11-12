import { NextRequest, NextResponse } from "next/server";
import { createLead, getLeads } from "@/lib/services/leadsService";
import { LeadFilters } from "@/lib/types/lead";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: LeadFilters = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      service: searchParams.get("service") || undefined,
      dateRange:
        (searchParams.get("dateRange") as LeadFilters["dateRange"]) ||
        undefined,
      sortBy:
        (searchParams.get("sortBy") as LeadFilters["sortBy"]) || "newest",
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!, 10)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : undefined,
    };

    const data = await getLeads(filters);
    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch leads";
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, budget, services, message } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { success: false, error: "Full name and email are required fields." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z\s.'-]+$/.test(String(fullName).trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name can only contain letters and standard punctuation.",
        },
        { status: 400 }
      );
    }

    if (phone) {
      const digitsOnly = String(phone).replace(/\D/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return NextResponse.json(
          {
            success: false,
            error: "Please provide a valid phone number (7 to 15 digits).",
          },
          { status: 400 }
        );
      }
    }

    const lead = await createLead({
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : "",
      budget: budget ? String(budget).trim() : "",
      services: Array.isArray(services) ? services : [],
      message: message ? String(message).trim() : "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your enquiry has been received successfully.",
        lead,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save lead";
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

