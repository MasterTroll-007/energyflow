import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activities = await prisma.activity.findMany({
      where: { zakazkaId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Activities GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání aktivit" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Zpráva je povinná" }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        zakazkaId: id,
        type: "note",
        message,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Activity POST error:", error);
    return NextResponse.json({ error: "Chyba při přidávání poznámky" }, { status: 500 });
  }
}
