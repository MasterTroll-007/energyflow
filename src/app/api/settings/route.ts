import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání nastavení" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, ico, dic, address, email, phone, bankAccount } = body;

    const settings = await prisma.companySettings.upsert({
      where: { id: "default" },
      update: { companyName, ico, dic, address, email, phone, bankAccount },
      create: {
        id: "default",
        companyName,
        ico,
        dic,
        address,
        email,
        phone,
        bankAccount,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Chyba při ukládání nastavení" }, { status: 500 });
  }
}
