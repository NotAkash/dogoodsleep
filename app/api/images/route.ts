import { NextResponse } from "next/server";
import { getImagesPage } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? "12");
    const limit = Number.isFinite(limitParam) ? limitParam : 12;
    const cursor = searchParams.get("cursor") ?? undefined;

    const { images, nextCursor } = await getImagesPage(limit, cursor);
    return NextResponse.json({ images, nextCursor });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
