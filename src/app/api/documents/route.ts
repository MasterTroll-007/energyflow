import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zakazkaId = searchParams.get("zakazkaId");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (zakazkaId) where.zakazkaId = zakazkaId;
    if (category) where.category = category;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { zakazka: { include: { client: true } } },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání dokumentů" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const zakazkaId = formData.get("zakazkaId") as string;
    const category = formData.get("category") as string;
    const name = formData.get("name") as string;

    if (!file || !zakazkaId || !category) {
      return NextResponse.json(
        { error: "Soubor, zakázka a kategorie jsou povinné" },
        { status: 400 }
      );
    }

    // File type validation
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Nepodporovaný typ souboru. Povolené typy: ${allowedExtensions.join(", ")}` },
        { status: 400 }
      );
    }

    // File size validation - max 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Soubor je příliš velký. Maximální velikost je 10 MB." },
        { status: 400 }
      );
    }

    const uploadsDir = join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${uuidv4()}.${ext}`;
    const filePath = join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const document = await prisma.document.create({
      data: {
        zakazkaId,
        name: name || file.name,
        fileName,
        fileSize: file.size,
        category,
      },
    });

    await prisma.activity.create({
      data: {
        zakazkaId,
        type: "document_upload",
        message: `Nahrán dokument "${name || file.name}"`,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Document POST error:", error);
    return NextResponse.json({ error: "Chyba při nahrávání dokumentu" }, { status: 500 });
  }
}
