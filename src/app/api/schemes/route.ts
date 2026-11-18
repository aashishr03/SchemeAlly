import { NextResponse, type NextRequest } from "next/server";
import { getSchemeDiscoveryCatalogue } from "@/services/scheme/scheme-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawFilters = {
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      level: searchParams.get("level") ?? undefined,
      state: searchParams.get("state") ?? undefined,
      audience: searchParams.get("audience") ?? undefined,
    };

    const catalogue = await getSchemeDiscoveryCatalogue(rawFilters);
    return NextResponse.json(catalogue, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to load scheme catalogue.",
      },
      { status: 500 }
    );
  }
}
