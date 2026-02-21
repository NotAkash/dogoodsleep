import { NextResponse } from "next/server";
import { getImagesPage } from "@/lib/r2";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/images:
 *   get:
 *     description: "Fetches a paginated list of images."
 *     parameters:
 *       - name: "limit"
 *         in: "query"
 *         description: "The number of images to fetch."
 *         required: false
 *         schema:
 *           type: "integer"
 *           default: 12
 *       - name: "cursor"
 *         in: "query"
 *         description: "The cursor for pagination."
 *         required: false
 *         schema:
 *           type: "string"
 *     responses:
 *       200:
 *         description: "A paginated list of images."
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 images:
 *                   type: "array"
 *                   items:
 *                     $ref: "#/components/schemas/R2Image"
 *                 nextCursor:
 *                   type: "string"
 *       500:
 *         description: "An error occurred."
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 error:
 *                   type: "string"
 */
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