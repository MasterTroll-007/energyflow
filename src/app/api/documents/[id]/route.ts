import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join, resolve } from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return NextResponse.json({ error: "Dokument nenalezen" }, { status: 404 });
    }

    // Try to delete the file with path traversal protection
    try {
      const uploadsDir = resolve(process.cwd(), "uploads");
      const filePath = resolve(uploadsDir, document.fileName);

      // Verify the resolved path is within the uploads directory
      if (!filePath.startsWith(uploadsDir)) {
        return NextResponse.json(
          { error: "Přístup odepřen: neplatná cesta k souboru" },
          { status: 403 }
        );
      }

      await unlink(filePath);
    } catch {
      // File may not exist, continue anyway
    }

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document DELETE error:", error);
    return NextResponse.json({ error: "Chyba při mazání dokumentu" }, { status: 500 });
  }
}
