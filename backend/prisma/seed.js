import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.auditLog.deleteMany({});
  await prisma.renewal.deleteMany({});
  await prisma.communicationLog.deleteMany({});
  await prisma.rentalHistory.deleteMany({});
  await prisma.equipmentPreference.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const staffPassword = await bcrypt.hash('staff123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'SD Digitals Admin',
      email: 'admin@sddigitals.com',
      password: adminPassword,
      role: 'Admin',
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Sarah Staff',
      email: 'staff@sddigitals.com',
      password: staffPassword,
      role: 'Staff',
    },
  });

  console.log('Seeding clients...');
  
  // Base date for relative date calculation (mimic June 11, 2026 as current system date)
  const refDate = new Date('2026-06-11T12:00:00Z');
  
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const subDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  // Seed Clients
  const clientsData = [
    {
      clientName: "David Miller",
      companyName: "Apex Tech Labs",
      email: "d.miller@apextech.com",
      phone: "+1 (555) 019-2834",
      clientType: "Production House",
      address: "128 Tech Parkway, Suite 400, Austin, TX",
      preferredCommunication: "Email, Phone Call",
      contractStartDate: new Date("2025-06-15T00:00:00Z"),
      renewalDate: subDays(refDate, 6), // June 5, 2026 (Expired)
      status: "Expired",
      notes: "Client requested dynamic scaling. Contract needs immediate renegotiation.",
      preferences: [
        { equipmentName: "RED V-Raptor 8K Camera", category: "Cameras" },
        { equipmentName: "Zeiss CP.3 Cine Lens Set", category: "Lenses" }
      ],
      history: [
        { equipmentName: "RED V-Raptor 8K Camera", rentalStart: new Date("2025-06-15"), rentalEnd: subDays(refDate, 6), amount: 26400.0, status: "Completed" }
      ],
      comms: [
        { communicationType: "Email", communicationDate: subDays(refDate, 30), remarks: "Sent 30-Day Contract Expiry Warning. No response." },
        { communicationType: "Email", communicationDate: subDays(refDate, 7), remarks: "Sent 7-Day Critical Contract Expiry Alert." },
        { communicationType: "Call", communicationDate: subDays(refDate, 3), remarks: "Called client. Left voicemail regarding urgent renewal." }
      ],
      renewalAlert: { alertStatus: "Red", renewalStatus: "Pending" }
    },
    {
      clientName: "Sarah Connor",
      companyName: "Cyberdyne Systems",
      email: "s.connor@cyberdyne.io",
      phone: "+1 (555) 012-9988",
      clientType: "Production House",
      address: "742 Evergreen Terrace, Los Angeles, CA",
      preferredCommunication: "WhatsApp, Phone Call",
      contractStartDate: new Date("2025-06-15T00:00:00Z"),
      renewalDate: addDays(refDate, 2), // June 13, 2026 (Critical, 2 days left)
      status: "Active",
      notes: "Includes backup battery arrays and heavy rugged camera cages.",
      preferences: [
        { equipmentName: "Sony FX9 Camera Body", category: "Cameras" },
        { equipmentName: "Sony FE 200-600mm Lens", category: "Lenses" },
        { equipmentName: "Aputure 600d Pro LED Light", category: "Lighting" }
      ],
      history: [
        { equipmentName: "Sony FX9 Rental Pack", rentalStart: new Date("2025-06-15"), rentalEnd: addDays(refDate, 2), amount: 60500.0, status: "Active" }
      ],
      comms: [
        { communicationType: "Email", communicationDate: subDays(refDate, 28), remarks: "Sent 30-Day renewal notice. Customer acknowledged and requested updated quote." },
        { communicationType: "WhatsApp", communicationDate: subDays(refDate, 5), remarks: "Followed up with updated contract details. Sarah said she needs approval from Director." }
      ],
      renewalAlert: { alertStatus: "Orange", renewalStatus: "Pending" }
    },
    {
      clientName: "Marcus Vance",
      companyName: "Vance Logistics Corp",
      email: "marcus@vancelogistics.com",
      phone: "+1 (555) 015-7766",
      clientType: "Event Company",
      address: "983 industrial Blvd, Atlanta, GA",
      preferredCommunication: "Email",
      contractStartDate: new Date("2025-07-01T00:00:00Z"),
      renewalDate: addDays(refDate, 7), // June 18, 2026 (Critical, 7 days left)
      status: "Active",
      notes: "Fleet photography package. Equipment is handled directly by SD Digitals service crew.",
      preferences: [
        { equipmentName: "DJI Inspire 3 Drone Pack", category: "Cameras" },
        { equipmentName: "Sennheiser AVX Wireless Mics", category: "Audio Equipment" }
      ],
      history: [
        { equipmentName: "DJI Inspire 3 Drone", rentalStart: new Date("2025-07-01"), rentalEnd: addDays(refDate, 7), amount: 41250.0, status: "Active" }
      ],
      comms: [
        { communicationType: "Email", communicationDate: subDays(refDate, 23), remarks: "Sent 30-Day contract expiry notification. No reply yet." }
      ],
      renewalAlert: { alertStatus: "Orange", renewalStatus: "Pending" }
    },
    {
      clientName: "Elena Rostova",
      companyName: "Aurora Digital Designs",
      email: "elena.r@aurora.design",
      phone: "+1 (555) 017-3344",
      clientType: "Wedding Photographer",
      address: "305 Ocean Drive, Miami, FL",
      preferredCommunication: "WhatsApp, Email",
      contractStartDate: new Date("2025-10-01T00:00:00Z"),
      renewalDate: addDays(refDate, 17), // June 28, 2026 (Warning, 17 days left)
      status: "Active",
      notes: "Lenses and sound packages are hired separately on an ad-hoc basis.",
      preferences: [
        { equipmentName: "Sony FX3 Full-Frame Camera", category: "Cameras" },
        { equipmentName: "Sony FE 24-70mm f/2.8 GM II", category: "Lenses" },
        { equipmentName: "Profoto B10X Flash Strobe", category: "Lighting" }
      ],
      history: [
        { equipmentName: "Sony FX3 Camera Rig", rentalStart: new Date("2025-10-01"), rentalEnd: addDays(refDate, 17), amount: 14400.0, status: "Active" }
      ],
      comms: [
        { communicationType: "WhatsApp", communicationDate: subDays(refDate, 10), remarks: "Chatted with Elena. She wants to extend for another 6 months. Will send contract." }
      ],
      renewalAlert: { alertStatus: "Yellow", renewalStatus: "Pending" }
    },
    {
      clientName: "Bruce Wayne",
      companyName: "Wayne Enterprises",
      email: "bruce@waynecorp.co",
      phone: "+1 (555) 019-0000",
      clientType: "Production House",
      address: "1007 Mountain Drive, Gotham City, NJ",
      preferredCommunication: "Phone Call",
      contractStartDate: new Date("2025-01-01T00:00:00Z"),
      renewalDate: addDays(refDate, 29), // June 10, 2026 (Warning, 29 days left)
      status: "Active",
      notes: "VIP access clearances required. High-speed recording systems preferred.",
      preferences: [
        { equipmentName: "Phantom Flex4K High Speed Camera", category: "Cameras" },
        { equipmentName: "Arri Signature Prime 35mm", category: "Lenses" }
      ],
      history: [
        { equipmentName: "Phantom Flex4K Rental Package", rentalStart: new Date("2025-01-01"), rentalEnd: addDays(refDate, 29), amount: 75000.0, status: "Active" }
      ],
      comms: [
        { communicationType: "Call", communicationDate: subDays(refDate, 5), remarks: "Spoke with assistant. Extension details are being reviewed by Wayne Board." }
      ],
      renewalAlert: { alertStatus: "Yellow", renewalStatus: "Pending" }
    },
    {
      clientName: "Diana Prince",
      companyName: "The Antiquities Registry",
      email: "diana.prince@registry.org",
      phone: "+1 (555) 011-5544",
      clientType: "Other",
      address: "National Museum, Washington DC",
      preferredCommunication: "Email",
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      renewalDate: addDays(refDate, 203), // Safe (203 days left)
      status: "Active",
      notes: "Secure Climate-Controlled Storage parameters.",
      preferences: [
        { equipmentName: "Secure Cases and Tracking Mounts", category: "Audio Equipment" }
      ],
      history: [
        { equipmentName: "Secure Gear Transport Pack", rentalStart: new Date("2024-01-01"), rentalEnd: addDays(refDate, 203), amount: 121800.0, status: "Active" }
      ],
      comms: [],
      renewalAlert: { alertStatus: "Green", renewalStatus: "Pending" }
    },
    {
      clientName: "Tony Stark",
      companyName: "Stark Solutions",
      email: "tony@stark.solutions",
      phone: "+1 (555) 018-3000",
      clientType: "Production House",
      address: "10880 Wilshire Blvd, Los Angeles, CA",
      preferredCommunication: "Email, WhatsApp",
      contractStartDate: new Date("2026-01-10T00:00:00Z"),
      renewalDate: addDays(refDate, 212), // Safe (212 days left)
      status: "Active",
      notes: "Requires customized power mounts and high-amp grid connections.",
      preferences: [
        { equipmentName: "Custom Laser Holographic Projector", category: "Lighting" },
        { equipmentName: "Red V-Raptor 8K Camera", category: "Cameras" }
      ],
      history: [
        { equipmentName: "Arri Cine Gear Set", rentalStart: new Date("2026-01-10"), rentalEnd: addDays(refDate, 212), amount: 102000.0, status: "Active" }
      ],
      comms: [
        { communicationType: "Email", communicationDate: subDays(refDate, 15), remarks: "Client requested specs sheet for updated 8K sensor modules." }
      ],
      renewalAlert: { alertStatus: "Green", renewalStatus: "Pending" }
    },
    {
      clientName: "Peter Parker",
      companyName: "Daily Bugle Media",
      email: "p.parker@dailybugle.net",
      phone: "+1 (555) 012-3456",
      clientType: "YouTuber",
      address: "20 Ingram St, Forest Hills, NY",
      preferredCommunication: "WhatsApp",
      contractStartDate: new Date("2026-03-01T00:00:00Z"),
      renewalDate: addDays(refDate, 19), // Warning (19 days left)
      status: "Active",
      notes: "User reported a small scratch on body shell during last check-in. Needs regular monitoring.",
      preferences: [
        { equipmentName: "Sony Alpha 7S III Camera", category: "Cameras" },
        { equipmentName: "Sony FE 24-70mm Lens", category: "Lenses" },
        { equipmentName: "Rode Wireless PRO Audio Kit", category: "Audio Equipment" }
      ],
      history: [
        { equipmentName: "Sony Vlogging Starter Kit", rentalStart: new Date("2026-03-01"), rentalEnd: addDays(refDate, 19), amount: 3800.0, status: "Active" }
      ],
      comms: [
        { communicationType: "WhatsApp", communicationDate: subDays(refDate, 1), remarks: "Sent 30-day reminder. Peter mentioned he is checking his freelance budget for next month." }
      ],
      renewalAlert: { alertStatus: "Yellow", renewalStatus: "Pending" }
    },
    {
      clientName: "Clark Kent",
      companyName: "Metropolis Planet Media",
      email: "c.kent@planetmedia.com",
      phone: "+1 (555) 013-9876",
      clientType: "Videographer",
      address: "345 Broadway, Metropolis, NY",
      preferredCommunication: "Email",
      contractStartDate: new Date("2025-09-15T00:00:00Z"),
      renewalDate: subDays(refDate, 27), // Expired (27 days ago)
      status: "Inactive",
      notes: "Account suspended temporarily due to billing dispute on extra data usage.",
      preferences: [
        { equipmentName: "Canon EOS C300 Mark III", category: "Cameras" },
        { equipmentName: "Canon CN-E Cine Prime Lenses", category: "Lenses" }
      ],
      history: [
        { equipmentName: "Canon Broadcast Bundle", rentalStart: new Date("2025-09-15"), rentalEnd: subDays(refDate, 27), amount: 25600.0, status: "Completed" }
      ],
      comms: [
        { communicationType: "Email", communicationDate: subDays(refDate, 40), remarks: "Sent pre-expiry warning." },
        { communicationType: "Email", communicationDate: subDays(refDate, 28), remarks: "Sent invoice notice. Account suspended following non-payment." }
      ],
      renewalAlert: { alertStatus: "Red", renewalStatus: "Archived" }
    }
  ];

  for (const c of clientsData) {
    const createdClient = await prisma.client.create({
      data: {
        clientName: c.clientName,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        clientType: c.clientType,
        address: c.address,
        preferredCommunication: c.preferredCommunication,
        contractStartDate: c.contractStartDate,
        renewalDate: c.renewalDate,
        status: c.status,
        notes: c.notes,
        equipmentPreferences: {
          create: c.preferences
        },
        rentalHistory: {
          create: c.history
        },
        communicationLogs: {
          create: c.comms
        },
        renewals: {
          create: {
            renewalDate: c.renewalDate,
            alertStatus: c.renewalAlert.alertStatus,
            renewalStatus: c.renewalAlert.renewalStatus
          }
        }
      }
    });

    console.log(`Created client ${createdClient.clientName} with ID ${createdClient.id}`);
  }

  // Create some audit logs
  console.log('Seeding audit logs...');
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'Initialized Database with default seed data', timestamp: subDays(refDate, 10) },
      { userId: admin.id, action: 'Configured default SMTP notification routes', timestamp: subDays(refDate, 8) },
      { userId: staff.id, action: 'Updated notes for client Sarah Connor', timestamp: subDays(refDate, 4) },
      { userId: staff.id, action: 'Logged WhatsApp conversation with client Elena Rostova', timestamp: subDays(refDate, 2) },
    ]
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
