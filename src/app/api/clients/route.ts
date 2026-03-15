import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const clients = await prisma.client.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { companyName: { contains: search } },
              { ico: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { zakazky: true, invoices: true },
        },
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Clients GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání klientů" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, ico, companyName, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Jméno je povinné" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: { name, email, phone, address, ico, companyName, notes },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Client POST error:", error);
    return NextResponse.json({ error: "Chyba při vytváření klienta" }, { status: 500 });
  }
}
