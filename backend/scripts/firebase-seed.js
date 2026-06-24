import db from '../config/firebase.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting Firestore Seeding...');

  // Helper to clear a collection
  async function deleteCollection(collectionPath) {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared collection: ${collectionPath}`);
  }

  await deleteCollection('users');
  await deleteCollection('clients');
  await deleteCollection('auditLogs');

  console.log('Seeding users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const staffPassword = await bcrypt.hash('staff123', salt);

  const adminRef = db.collection('users').doc();
  const adminId = adminRef.id;
  await adminRef.set({
    name: 'SD Digitals Admin',
    email: 'admin@sddigitals.com',
    password: adminPassword,
    role: 'Admin',
    createdAt: new Date().toISOString(),
  });

  const staffRef = db.collection('users').doc();
  const staffId = staffRef.id;
  await staffRef.set({
    name: 'Sarah Staff',
    email: 'staff@sddigitals.com',
    password: staffPassword,
    role: 'Staff',
    createdAt: new Date().toISOString(),
  });

  console.log('Seeding clients...');
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

  const clientsData = [
    {
      clientName: "David Miller",
      companyName: "Apex Tech Labs",
      email: "d.miller@apextech.com",
      phone: "+1 (555) 019-2834",
      clientType: "Production House",
      address: "128 Tech Parkway, Suite 400, Austin, TX",
      preferredCommunication: "Email, Phone Call",
      contractStartDate: new Date("2025-06-15T00:00:00Z").toISOString(),
      renewalDate: subDays(refDate, 6).toISOString(),
      status: "Expired",
      notes: "Client requested dynamic scaling. Contract needs immediate renegotiation.",
      preferences: [
        { id: "pref-1", equipmentName: "RED V-Raptor 8K Camera", category: "Cameras" },
        { id: "pref-2", equipmentName: "Zeiss CP.3 Cine Lens Set", category: "Lenses" }
      ],
      history: [
        { id: "hist-1", equipmentName: "RED V-Raptor 8K Camera", rentalStart: new Date("2025-06-15").toISOString(), rentalEnd: subDays(refDate, 6).toISOString(), amount: 26400.0, status: "Completed" }
      ],
      comms: [
        { id: "comm-1", communicationType: "Email", communicationDate: subDays(refDate, 30).toISOString(), remarks: "Sent 30-Day Contract Expiry Warning. No response." },
        { id: "comm-2", communicationType: "Email", communicationDate: subDays(refDate, 7).toISOString(), remarks: "Sent 7-Day Critical Contract Expiry Alert." },
        { id: "comm-3", communicationType: "Call", communicationDate: subDays(refDate, 3).toISOString(), remarks: "Called client. Left voicemail regarding urgent renewal." }
      ],
      renewalAlert: { id: "ren-1", renewalDate: subDays(refDate, 6).toISOString(), alertStatus: "Red", renewalStatus: "Pending" }
    },
    {
      clientName: "Sarah Connor",
      companyName: "Cyberdyne Systems",
      email: "s.connor@cyberdyne.io",
      phone: "+1 (555) 012-9988",
      clientType: "Production House",
      address: "742 Evergreen Terrace, Los Angeles, CA",
      preferredCommunication: "WhatsApp, Phone Call",
      contractStartDate: new Date("2025-06-15T00:00:00Z").toISOString(),
      renewalDate: addDays(refDate, 2).toISOString(),
      status: "Active",
      notes: "Includes backup battery arrays and heavy rugged camera cages.",
      preferences: [
        { id: "pref-3", equipmentName: "Sony FX9 Camera Body", category: "Cameras" },
        { id: "pref-4", equipmentName: "Sony FE 200-600mm Lens", category: "Lenses" },
        { id: "pref-5", equipmentName: "Aputure 600d Pro LED Light", category: "Lighting" }
      ],
      history: [
        { id: "hist-2", equipmentName: "Sony FX9 Rental Pack", rentalStart: new Date("2025-06-15").toISOString(), rentalEnd: addDays(refDate, 2).toISOString(), amount: 60500.0, status: "Active" }
      ],
      comms: [
        { id: "comm-4", communicationType: "Email", communicationDate: subDays(refDate, 28).toISOString(), remarks: "Sent 30-Day renewal notice. Customer acknowledged and requested updated quote." },
        { id: "comm-5", communicationType: "WhatsApp", communicationDate: subDays(refDate, 5).toISOString(), remarks: "Followed up with updated contract details. Sarah said she needs approval from Director." }
      ],
      renewalAlert: { id: "ren-2", renewalDate: addDays(refDate, 2).toISOString(), alertStatus: "Orange", renewalStatus: "Pending" }
    },
    {
      clientName: "Marcus Vance",
      companyName: "Vance Logistics Corp",
      email: "marcus@vancelogistics.com",
      phone: "+1 (555) 015-7766",
      clientType: "Event Company",
      address: "983 industrial Blvd, Atlanta, GA",
      preferredCommunication: "Email",
      contractStartDate: new Date("2025-07-01T00:00:00Z").toISOString(),
      renewalDate: addDays(refDate, 7).toISOString(),
      status: "Active",
      notes: "Fleet photography package. Equipment is handled directly by SD Digitals service crew.",
      preferences: [
        { id: "pref-6", equipmentName: "DJI Inspire 3 Drone Pack", category: "Cameras" },
        { id: "pref-7", equipmentName: "Sennheiser AVX Wireless Mics", category: "Audio Equipment" }
      ],
      history: [
        { id: "hist-3", equipmentName: "DJI Inspire 3 Drone", rentalStart: new Date("2025-07-01").toISOString(), rentalEnd: addDays(refDate, 7).toISOString(), amount: 41250.0, status: "Active" }
      ],
      comms: [
        { id: "comm-6", communicationType: "Email", communicationDate: subDays(refDate, 23).toISOString(), remarks: "Sent 30-Day contract expiry notification. No reply yet." }
      ],
      renewalAlert: { id: "ren-3", renewalDate: addDays(refDate, 7).toISOString(), alertStatus: "Orange", renewalStatus: "Pending" }
    },
    {
      clientName: "Elena Rostova",
      companyName: "Aurora Digital Designs",
      email: "elena.r@aurora.design",
      phone: "+1 (555) 017-3344",
      clientType: "Wedding Photographer",
      address: "305 Ocean Drive, Miami, FL",
      preferredCommunication: "WhatsApp, Email",
      contractStartDate: new Date("2025-10-01T00:00:00Z").toISOString(),
      renewalDate: addDays(refDate, 17).toISOString(),
      status: "Active",
      notes: "Lenses and sound packages are hired separately on an ad-hoc basis.",
      preferences: [
        { id: "pref-8", equipmentName: "Sony FX3 Full-Frame Camera", category: "Cameras" },
        { id: "pref-9", equipmentName: "Sony FE 24-70mm f/2.8 GM II", category: "Lenses" },
        { id: "pref-10", equipmentName: "Profoto B10X Flash Strobe", category: "Lighting" }
      ],
      history: [
        { id: "hist-4", equipmentName: "Sony FX3 Camera Rig", rentalStart: new Date("2025-10-01").toISOString(), rentalEnd: addDays(refDate, 17).toISOString(), amount: 14400.0, status: "Active" }
      ],
      comms: [
        { id: "comm-7", communicationType: "WhatsApp", communicationDate: subDays(refDate, 10).toISOString(), remarks: "Chatted with Elena. She wants to extend for another 6 months. Will send contract." }
      ],
      renewalAlert: { id: "ren-4", renewalDate: addDays(refDate, 17).toISOString(), alertStatus: "Yellow", renewalStatus: "Pending" }
    },
    {
      clientName: "Bruce Wayne",
      companyName: "Wayne Enterprises",
      email: "bruce@waynecorp.co",
      phone: "+1 (555) 019-0000",
      clientType: "Production House",
      address: "1007 Mountain Drive, Gotham City, NJ",
      preferredCommunication: "Phone Call",
      contractStartDate: new Date("2025-01-01T00:00:00Z").toISOString(),
      renewalDate: addDays(refDate, 29).toISOString(),
      status: "Active",
      notes: "VIP access clearances required. High-speed recording systems preferred.",
      preferences: [
        { id: "pref-11", equipmentName: "Phantom Flex4K High Speed Camera", category: "Cameras" },
        { id: "pref-12", equipmentName: "Arri Signature Prime 35mm", category: "Lenses" }
      ],
      history: [
        { id: "hist-5", equipmentName: "Phantom Flex4K Rental Package", rentalStart: new Date("2025-01-01").toISOString(), rentalEnd: addDays(refDate, 29).toISOString(), amount: 75000.0, status: "Active" }
      ],
      comms: [
        { id: "comm-8", communicationType: "Call", communicationDate: subDays(refDate, 5).toISOString(), remarks: "Spoke with assistant. Extension details are being reviewed by Wayne Board." }
      ],
      renewalAlert: { id: "ren-5", renewalDate: addDays(refDate, 29).toISOString(), alertStatus: "Yellow", renewalStatus: "Pending" }
    },
    {
      clientName: "Diana Prince",
      companyName: "The Antiquities Registry",
      email: "diana.prince@registry.org",
      phone: "+1 (555) 011-5544",
      clientType: "Other",
      address: "National Museum, Washington DC",
      preferredCommunication: "Email",
      contractStartDate: new Date("2024-01-01T00:00:00Z").toISOString(),
      renewalDate: addDays(refDate, 203).toISOString(),
      status: "Active",
      notes: "Secure Climate-Controlled Storage parameters.",
      preferences: [
        { id: "pref-13", equipmentName: "Secure Cases and Tracking Mounts", category: "Audio Equipment" }
      ],
      history: [
        { id: "hist-6", equipmentName: "Secure Gear Transport Pack", rentalStart: new Date("2024-01-01").toISOString(), rentalEnd: addDays(refDate, 203).toISOString(), amount: 121800.0, status: "Active" }
      ],
      comms: [],
      renewalAlert: { id: "ren-6", renewalDate: addDays(refDate, 203).toISOString(), alertStatus: "Green", renewalStatus: "Pending" }
    },
    {
      clientName: "Tony Stark",
      companyName: "Stark Solutions",
      email: "tony@stark.solutions",
      phone: "+1 (555) 018-3000",
      clientType: "Production House",
      address: "10880 Wilshire Blvd, Los Angeles, CA",
      preferredCommunication: "Email, WhatsApp",
      contractStartDate: new Date("2026-01-10T00:00:00Z").toISOString(),
      renewalDate: addDays(refDate, 212).toISOString(),
      status: "Active",
      notes: "Requires customized power mounts and high-amp grid connections.",
      preferences: [
        { id: "pref-14", equipmentName: "Custom Laser Holographic Projector", category: "Lighting" },
        { id: "pref-15", equipmentName: "Red V-Raptor 8K Camera", category: "Cameras" }
      ],
      history: [
        { id: "hist-7", equipmentName: "Arri Cine Gear Set", rentalStart: new Date("2026-01-10").toISOString(), rentalEnd: addDays(refDate, 212).toISOString(), amount: 102000.0, status: "Active" }
      ],
      comms: [
        { id: "comm-9", communicationType: "Email", communicationDate: subDays(refDate, 15).toISOString(), remarks: "Client requested specs sheet for updated 8K sensor modules." }
      ],
      renewalAlert: { id: "ren-7", renewalDate: addDays(refDate, 212).toISOString(), alertStatus: "Green", renewalStatus: "Pending" }
    },
    {
      clientName: "Peter Parker",
      companyName: "Daily Bugle Media",
      email: "p.parker@dailybugle.net",
      phone: "+1 (555) 012-3456",
      clientType: "YouTuber",
      address: "20 Ingram St, Forest Hills, NY",
      preferredCommunication: "WhatsApp",
      contractStartDate: new Date("2026-03-01T00:00:00Z").toISOString(),
      renewalDate: addDays(refDate, 19).toISOString(),
      status: "Active",
      notes: "User reported a small scratch on body shell during last check-in. Needs regular monitoring.",
      preferences: [
        { id: "pref-16", equipmentName: "Sony Alpha 7S III Camera", category: "Cameras" },
        { id: "pref-17", equipmentName: "Sony FE 24-70mm Lens", category: "Lenses" },
        { id: "pref-18", equipmentName: "Rode Wireless PRO Audio Kit", category: "Audio Equipment" }
      ],
      history: [
        { id: "hist-8", equipmentName: "Sony Vlogging Starter Kit", rentalStart: new Date("2026-03-01").toISOString(), rentalEnd: addDays(refDate, 19).toISOString(), amount: 3800.0, status: "Active" }
      ],
      comms: [
        { id: "comm-10", communicationType: "WhatsApp", communicationDate: subDays(refDate, 1).toISOString(), remarks: "Sent 30-day reminder. Peter mentioned he is checking his freelance budget for next month." }
      ],
      renewalAlert: { id: "ren-8", renewalDate: addDays(refDate, 19).toISOString(), alertStatus: "Yellow", renewalStatus: "Pending" }
    },
    {
      clientName: "Clark Kent",
      companyName: "Metropolis Planet Media",
      email: "c.kent@planetmedia.com",
      phone: "+1 (555) 013-9876",
      clientType: "Videographer",
      address: "345 Broadway, Metropolis, NY",
      preferredCommunication: "Email",
      contractStartDate: new Date("2025-09-15T00:00:00Z").toISOString(),
      renewalDate: subDays(refDate, 27).toISOString(),
      status: "Inactive",
      notes: "Account suspended temporarily due to billing dispute on extra data usage.",
      preferences: [
        { id: "pref-19", equipmentName: "Canon EOS C300 Mark III", category: "Cameras" },
        { id: "pref-20", equipmentName: "Canon CN-E Cine Prime Lenses", category: "Lenses" }
      ],
      history: [
        { id: "hist-9", equipmentName: "Canon Broadcast Bundle", rentalStart: new Date("2025-09-15").toISOString(), rentalEnd: subDays(refDate, 27).toISOString(), amount: 25600.0, status: "Completed" }
      ],
      comms: [
        { id: "comm-11", communicationType: "Email", communicationDate: subDays(refDate, 40).toISOString(), remarks: "Sent pre-expiry warning." },
        { id: "comm-12", communicationType: "Email", communicationDate: subDays(refDate, 28).toISOString(), remarks: "Sent invoice notice. Account suspended following non-payment." }
      ],
      renewalAlert: { id: "ren-9", renewalDate: subDays(refDate, 27).toISOString(), alertStatus: "Red", renewalStatus: "Archived" }
    }
  ];

  for (const c of clientsData) {
    const clientRef = db.collection('clients').doc();
    await clientRef.set({
      clientName: c.clientName,
      companyName: c.companyName || '',
      email: c.email,
      phone: c.phone,
      clientType: c.clientType,
      address: c.address || '',
      preferredCommunication: c.preferredCommunication,
      contractStartDate: c.contractStartDate,
      renewalDate: c.renewalDate,
      status: c.status,
      notes: c.notes || '',
      equipmentPreferences: c.preferences,
      rentalHistory: c.history,
      communicationLogs: c.comms,
      renewals: [c.renewalAlert]
    });
    console.log(`Created client: ${c.clientName} (${clientRef.id})`);
  }

  console.log('Seeding audit logs...');
  const auditLogs = [
    { userId: adminId, user: { name: 'SD Digitals Admin', email: 'admin@sddigitals.com', role: 'Admin' }, action: 'Initialized Database with default seed data', timestamp: subDays(refDate, 10).toISOString() },
    { userId: adminId, user: { name: 'SD Digitals Admin', email: 'admin@sddigitals.com', role: 'Admin' }, action: 'Configured default SMTP notification routes', timestamp: subDays(refDate, 8).toISOString() },
    { userId: staffId, user: { name: 'Sarah Staff', email: 'staff@sddigitals.com', role: 'Staff' }, action: 'Updated notes for client Sarah Connor', timestamp: subDays(refDate, 4).toISOString() },
    { userId: staffId, user: { name: 'Sarah Staff', email: 'staff@sddigitals.com', role: 'Staff' }, action: 'Logged WhatsApp conversation with client Elena Rostova', timestamp: subDays(refDate, 2).toISOString() },
  ];

  for (const log of auditLogs) {
    await db.collection('auditLogs').add(log);
  }

  console.log('Firestore seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
