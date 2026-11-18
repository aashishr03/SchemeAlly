import { NextResponse, type NextRequest } from "next/server";
import { getSchemeDetailsBySlug } from "@/services/scheme/scheme-service";
import { SchemeSlugSchema } from "@/services/scheme/schema";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const parsedSlug = SchemeSlugSchema.safeParse(slug);

    if (!parsedSlug.success) {
      return NextResponse.json(
        { error: "Invalid scheme slug format." },
        { status: 400 }
      );
    }

    const scheme = await getSchemeDetailsBySlug(parsedSlug.data);
    if (!scheme) {
      return NextResponse.json(
        { error: "Scheme not found or not verified." },
        { status: 404 }
      );
    }

    return NextResponse.json({ scheme }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to load scheme details.",
      },
      { status: 500 }
    );
  }
}
