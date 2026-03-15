import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.document.deleteMany();
  await prisma.penb.deleteMany();
  await prisma.zakazka.deleteMany();
  await prisma.client.deleteMany();
  await prisma.defaultPrice.deleteMany();
  await prisma.companySettings.deleteMany();

  // Company settings
  await prisma.companySettings.create({
    data: {
      id: "default",
      companyName: "EnergoPro s.r.o.",
      ico: "12345678",
      dic: "CZ12345678",
      address: "Energetická 42, 110 00 Praha 1",
      email: "info@energopro.cz",
      phone: "+420 777 123 456",
      bankAccount: "1234567890/0100",
    },
  });

  // Default prices
  const prices = [
    { serviceName: "PENB - rodinný dům", price: 5000 },
    { serviceName: "PENB - bytový dům", price: 12000 },
    { serviceName: "PENB - komerční budova", price: 18000 },
    { serviceName: "Energetický audit", price: 25000 },
    { serviceName: "Energetický posudek", price: 35000 },
    { serviceName: "Konzultace (1 hod)", price: 1500 },
  ];

  for (const p of prices) {
    await prisma.defaultPrice.create({ data: p });
  }

  // Clients
  const client1 = await prisma.client.create({
    data: {
      name: "Jan Novák",
      email: "jan.novak@email.cz",
      phone: "+420 602 111 222",
      address: "Květná 15, 130 00 Praha 3",
      ico: "87654321",
      companyName: "Novák Reality s.r.o.",
      notes: "Dlouhodobý klient, spolupráce od roku 2022",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Marie Svobodová",
      email: "marie.svobodova@gmail.com",
      phone: "+420 603 222 333",
      address: "Lipová 8, 602 00 Brno",
      notes: "Preferuje komunikaci e-mailem",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Petr Dvořák",
      email: "dvorak@stavebnifirma.cz",
      phone: "+420 604 333 444",
      address: "Stavební 22, 301 00 Plzeň",
      ico: "11223344",
      companyName: "Dvořák Stavby a.s.",
    },
  });

  const client4 = await prisma.client.create({
    data: {
      name: "Eva Černá",
      email: "eva.cerna@seznam.cz",
      phone: "+420 605 444 555",
      address: "Zahradní 3, 370 01 České Budějovice",
    },
  });

  const client5 = await prisma.client.create({
    data: {
      name: "Tomáš Procházka",
      email: "tomas@prochazka-invest.cz",
      phone: "+420 606 555 666",
      address: "Obchodní 10, 500 02 Hradec Králové",
      ico: "55667788",
      companyName: "Procházka Invest s.r.o.",
      notes: "Velký developer, potenciál pro pravidelné zakázky",
    },
  });

  // Zakazky
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const z1 = await prisma.zakazka.create({
    data: {
      clientId: client1.id,
      address: "Květná 15, Praha 3",
      type: "PENB",
      status: "v_reseni",
      price: 5000,
      deadline: twoWeeksLater,
      notes: "Rodinný dům, 2 podlaží, potřeba změřit tepelné ztráty",
    },
  });

  const z2 = await prisma.zakazka.create({
    data: {
      clientId: client1.id,
      address: "Obchodní centrum Galerie, Praha 5",
      type: "EA",
      status: "ceka_na_podklady",
      price: 25000,
      deadline: oneMonthLater,
      notes: "Čekáme na projektovou dokumentaci od architekta",
    },
  });

  const z3 = await prisma.zakazka.create({
    data: {
      clientId: client2.id,
      address: "Lipová 8, Brno",
      type: "PENB",
      status: "dokoncena",
      price: 5000,
      deadline: threeMonthsAgo,
    },
  });

  const z4 = await prisma.zakazka.create({
    data: {
      clientId: client3.id,
      address: "Bytový dům Na Kopci 12, Plzeň",
      type: "PENB",
      status: "fakturovana",
      price: 12000,
    },
  });

  const z5 = await prisma.zakazka.create({
    data: {
      clientId: client3.id,
      address: "Administrativní budova, Plzeň-Bory",
      type: "EP",
      status: "nova",
      price: 35000,
      deadline: oneMonthLater,
    },
  });

  const z6 = await prisma.zakazka.create({
    data: {
      clientId: client4.id,
      address: "Zahradní 3, České Budějovice",
      type: "PENB",
      status: "v_reseni",
      price: 5000,
      deadline: twoWeeksLater,
    },
  });

  const z7 = await prisma.zakazka.create({
    data: {
      clientId: client5.id,
      address: "Rezidenční projekt Sunrise, Hradec Králové",
      type: "PENB",
      status: "nova",
      price: 12000,
      deadline: oneMonthLater,
      notes: "Novostavba bytového domu, 4 podlaží, 24 bytů",
    },
  });

  // PENB certificates
  // One expiring soon (within 6 months)
  const expiringSoon = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000); // ~4 months
  const issuedLongAgo = new Date(expiringSoon.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);

  await prisma.penb.create({
    data: {
      zakazkaId: z3.id,
      certificateNumber: "PENB-2024-0042",
      buildingAddress: "Lipová 8, 602 00 Brno",
      energyClass: "C",
      issueDate: threeMonthsAgo,
      expiryDate: new Date(threeMonthsAgo.getTime() + 10 * 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.penb.create({
    data: {
      zakazkaId: z4.id,
      certificateNumber: "PENB-2023-0118",
      buildingAddress: "Na Kopci 12, 301 00 Plzeň",
      energyClass: "B",
      issueDate: sixMonthsAgo,
      expiryDate: new Date(sixMonthsAgo.getTime() + 10 * 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Create a PENB that's expiring soon (for testing alert)
  const z_old = await prisma.zakazka.create({
    data: {
      clientId: client2.id,
      address: "Stará 5, Brno-střed",
      type: "PENB",
      status: "fakturovana",
      price: 4500,
    },
  });

  await prisma.penb.create({
    data: {
      zakazkaId: z_old.id,
      certificateNumber: "PENB-2016-0003",
      buildingAddress: "Stará 5, 602 00 Brno-střed",
      energyClass: "E",
      issueDate: issuedLongAgo,
      expiryDate: expiringSoon,
    },
  });

  // Activities
  const activities = [
    { zakazkaId: z1.id, type: "status_change", message: "Zakázka byla vytvořena", createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z1.id, type: "status_change", message: 'Status změněn na "V řešení"', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z1.id, type: "note", message: "Provedena osobní obhlídka nemovitosti, budova v dobrém stavu", createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z1.id, type: "document_upload", message: 'Nahrán dokument "fotky_fasada.zip"', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z2.id, type: "status_change", message: "Zakázka byla vytvořena", createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z2.id, type: "status_change", message: 'Status změněn na "Čeká na podklady"', createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z2.id, type: "note", message: "Kontaktován architekt, dokumentace bude dodána do 2 týdnů", createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z3.id, type: "status_change", message: "Zakázka byla vytvořena", createdAt: threeMonthsAgo },
    { zakazkaId: z3.id, type: "status_change", message: 'Status změněn na "Dokončená"', createdAt: new Date(threeMonthsAgo.getTime() + 14 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z4.id, type: "status_change", message: "Zakázka byla vytvořena", createdAt: sixMonthsAgo },
    { zakazkaId: z4.id, type: "invoice_created", message: "Vytvořena faktura FV-2025-0001", createdAt: new Date(sixMonthsAgo.getTime() + 30 * 24 * 60 * 60 * 1000) },
    { zakazkaId: z4.id, type: "status_change", message: 'Status změněn na "Fakturovaná"', createdAt: new Date(sixMonthsAgo.getTime() + 30 * 24 * 60 * 60 * 1000) },
  ];

  for (const activity of activities) {
    await prisma.activity.create({ data: activity });
  }

  // Invoices
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: `FV-${now.getFullYear()}-0001`,
      clientId: client3.id,
      zakazkaId: z4.id,
      issueDate: new Date(sixMonthsAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(sixMonthsAgo.getTime() + 44 * 24 * 60 * 60 * 1000),
      status: "zaplaceno",
      totalAmount: 12000,
      items: {
        create: [
          {
            description: "PENB - bytový dům Na Kopci 12, Plzeň",
            quantity: 1,
            unitPrice: 12000,
            total: 12000,
          },
        ],
      },
    },
  });

  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: `FV-${now.getFullYear()}-0002`,
      clientId: client2.id,
      zakazkaId: z3.id,
      issueDate: new Date(threeMonthsAgo.getTime() + 14 * 24 * 60 * 60 * 1000),
      dueDate: new Date(threeMonthsAgo.getTime() + 28 * 24 * 60 * 60 * 1000),
      status: "zaplaceno",
      totalAmount: 5000,
      items: {
        create: [
          {
            description: "PENB - rodinný dům Lipová 8, Brno",
            quantity: 1,
            unitPrice: 5000,
            total: 5000,
          },
        ],
      },
    },
  });

  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: `FV-${now.getFullYear()}-0003`,
      clientId: client1.id,
      zakazkaId: z1.id,
      issueDate: now,
      dueDate: twoWeeksLater,
      status: "nezaplaceno",
      totalAmount: 5000,
      notes: "Prosíme o platbu na účet uvedený v záhlaví",
      items: {
        create: [
          {
            description: "PENB - rodinný dům Květná 15, Praha 3",
            quantity: 1,
            unitPrice: 5000,
            total: 5000,
          },
        ],
      },
    },
  });

  console.log("Seed completed!");
  console.log(`Created:`);
  console.log(`  - 1 company settings`);
  console.log(`  - ${prices.length} default prices`);
  console.log(`  - 5 clients`);
  console.log(`  - 8 zakazky`);
  console.log(`  - 3 PENB certificates (1 expiring soon)`);
  console.log(`  - ${activities.length} activities`);
  console.log(`  - 3 invoices`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
