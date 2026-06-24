// Supabase seeder via REST API (works through any firewall using HTTPS port 443)
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = 'https://nqacclngiqegmfmmglky.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYWNjbG5naXFlZ21mbW1nbGt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc1MjY3MCwiZXhwIjoyMDk3MzI4NjcwfQ.AQKhG-WfmzOmy1tvmgkpk5dUVkQkXONiuOlKYA-DgWI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function clearAll() {
  console.log('🗑️  Clearing existing data...');
  await supabase.from('AuditLog').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('Renewal').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('CommunicationLog').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('RentalHistory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('EquipmentPreference').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('Client').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('User').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✅ Cleared all tables');
}

async function main() {
  await clearAll();

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const staffHash = await bcrypt.hash('staff123', salt);

  // Create users
  console.log('👤 Creating users...');
  const { data: adminUser, error: adminErr } = await supabase.from('User').insert([
    { name: 'SD Digitals Admin', email: 'admin@sddigitals.com', password: adminHash, role: 'Admin' }
  ]).select().single();
  if (adminErr) { console.error('Admin user error:', adminErr); return; }
  console.log('  ✅ Admin:', adminUser.email);

  const { data: staffUser, error: staffErr } = await supabase.from('User').insert([
    { name: 'Sarah Staff', email: 'staff@sddigitals.com', password: staffHash, role: 'Staff' }
  ]).select().single();
  if (staffErr) { console.error('Staff user error:', staffErr); return; }
  console.log('  ✅ Staff:', staffUser.email);

  const refDate = new Date('2026-06-11T12:00:00Z');

  const clientsData = [
    {
      client: {
        clientName: 'David Miller', companyName: 'Apex Tech Labs',
        email: 'd.miller@apextech.com', phone: '+1 (555) 019-2834',
        clientType: 'Production House', address: '128 Tech Parkway, Suite 400, Austin, TX',
        preferredCommunication: 'Email, Phone Call',
        contractStartDate: new Date('2025-06-15T00:00:00Z').toISOString(),
        renewalDate: subDays(refDate, 6).toISOString(),
        status: 'Expired', paymentStatus: 'Unpaid',
        notes: 'Client requested dynamic scaling. Contract needs immediate renegotiation.'
      },
      preferences: [
        { equipmentName: 'RED V-Raptor 8K Camera', category: 'Cameras' },
        { equipmentName: 'Zeiss CP.3 Cine Lens Set', category: 'Lenses' }
      ],
      history: [{ equipmentName: 'RED V-Raptor 8K Camera', rentalStart: new Date('2025-06-15').toISOString(), rentalEnd: subDays(refDate, 6).toISOString(), amount: 26400.0, status: 'Completed' }],
      comms: [
        { communicationType: 'Email', communicationDate: subDays(refDate, 30).toISOString(), remarks: 'Sent 30-Day Contract Expiry Warning. No response.' },
        { communicationType: 'Email', communicationDate: subDays(refDate, 7).toISOString(), remarks: 'Sent 7-Day Critical Contract Expiry Alert.' },
        { communicationType: 'Call', communicationDate: subDays(refDate, 3).toISOString(), remarks: 'Called client. Left voicemail regarding urgent renewal.' }
      ],
      renewal: { alertStatus: 'Red', renewalStatus: 'Pending', renewalDate: subDays(refDate, 6).toISOString() }
    },
    {
      client: {
        clientName: 'Sarah Connor', companyName: 'Cyberdyne Systems',
        email: 's.connor@cyberdyne.io', phone: '+1 (555) 012-9988',
        clientType: 'Production House', address: '742 Evergreen Terrace, Los Angeles, CA',
        preferredCommunication: 'WhatsApp, Phone Call',
        contractStartDate: new Date('2025-06-15T00:00:00Z').toISOString(),
        renewalDate: addDays(refDate, 2).toISOString(),
        status: 'Active', paymentStatus: 'Paid',
        notes: 'Includes backup battery arrays and heavy rugged camera cages.'
      },
      preferences: [
        { equipmentName: 'Sony FX9 Camera Body', category: 'Cameras' },
        { equipmentName: 'Sony FE 200-600mm Lens', category: 'Lenses' },
        { equipmentName: 'Aputure 600d Pro LED Light', category: 'Lighting' }
      ],
      history: [{ equipmentName: 'Sony FX9 Rental Pack', rentalStart: new Date('2025-06-15').toISOString(), rentalEnd: addDays(refDate, 2).toISOString(), amount: 60500.0, status: 'Active' }],
      comms: [
        { communicationType: 'Email', communicationDate: subDays(refDate, 28).toISOString(), remarks: 'Sent 30-Day renewal notice. Customer acknowledged and requested updated quote.' },
        { communicationType: 'WhatsApp', communicationDate: subDays(refDate, 5).toISOString(), remarks: 'Followed up with updated contract details. Sarah said she needs approval from Director.' }
      ],
      renewal: { alertStatus: 'Orange', renewalStatus: 'Pending', renewalDate: addDays(refDate, 2).toISOString() }
    },
    {
      client: {
        clientName: 'Marcus Vance', companyName: 'Vance Logistics Corp',
        email: 'marcus@vancelogistics.com', phone: '+1 (555) 015-7766',
        clientType: 'Event Company', address: '983 Industrial Blvd, Atlanta, GA',
        preferredCommunication: 'Email',
        contractStartDate: new Date('2025-07-01T00:00:00Z').toISOString(),
        renewalDate: addDays(refDate, 7).toISOString(),
        status: 'Active', paymentStatus: 'Paid',
        notes: 'Fleet photography package. Equipment is handled directly by SD Digitals service crew.'
      },
      preferences: [
        { equipmentName: 'DJI Inspire 3 Drone Pack', category: 'Cameras' },
        { equipmentName: 'Sennheiser AVX Wireless Mics', category: 'Audio Equipment' }
      ],
      history: [{ equipmentName: 'DJI Inspire 3 Drone', rentalStart: new Date('2025-07-01').toISOString(), rentalEnd: addDays(refDate, 7).toISOString(), amount: 41250.0, status: 'Active' }],
      comms: [{ communicationType: 'Email', communicationDate: subDays(refDate, 23).toISOString(), remarks: 'Sent 30-Day contract expiry notification. No reply yet.' }],
      renewal: { alertStatus: 'Orange', renewalStatus: 'Pending', renewalDate: addDays(refDate, 7).toISOString() }
    },
    {
      client: {
        clientName: 'Elena Rostova', companyName: 'Aurora Digital Designs',
        email: 'elena.r@aurora.design', phone: '+1 (555) 017-3344',
        clientType: 'Wedding Photographer', address: '305 Ocean Drive, Miami, FL',
        preferredCommunication: 'WhatsApp, Email',
        contractStartDate: new Date('2025-10-01T00:00:00Z').toISOString(),
        renewalDate: addDays(refDate, 17).toISOString(),
        status: 'Active', paymentStatus: 'Paid',
        notes: 'Lenses and sound packages are hired separately on an ad-hoc basis.'
      },
      preferences: [
        { equipmentName: 'Sony FX3 Full-Frame Camera', category: 'Cameras' },
        { equipmentName: 'Sony FE 24-70mm f/2.8 GM II', category: 'Lenses' },
        { equipmentName: 'Profoto B10X Flash Strobe', category: 'Lighting' }
      ],
      history: [{ equipmentName: 'Sony FX3 Camera Rig', rentalStart: new Date('2025-10-01').toISOString(), rentalEnd: addDays(refDate, 17).toISOString(), amount: 14400.0, status: 'Active' }],
      comms: [{ communicationType: 'WhatsApp', communicationDate: subDays(refDate, 10).toISOString(), remarks: 'Chatted with Elena. She wants to extend for another 6 months. Will send contract.' }],
      renewal: { alertStatus: 'Yellow', renewalStatus: 'Pending', renewalDate: addDays(refDate, 17).toISOString() }
    },
    {
      client: {
        clientName: 'Bruce Wayne', companyName: 'Wayne Enterprises',
        email: 'bruce@waynecorp.co', phone: '+1 (555) 019-0000',
        clientType: 'Production House', address: '1007 Mountain Drive, Gotham City, NJ',
        preferredCommunication: 'Phone Call',
        contractStartDate: new Date('2025-01-01T00:00:00Z').toISOString(),
        renewalDate: addDays(refDate, 29).toISOString(),
        status: 'Active', paymentStatus: 'Paid',
        notes: 'VIP access clearances required. High-speed recording systems preferred.'
      },
      preferences: [
        { equipmentName: 'Phantom Flex4K High Speed Camera', category: 'Cameras' },
        { equipmentName: 'Arri Signature Prime 35mm', category: 'Lenses' }
      ],
      history: [{ equipmentName: 'Phantom Flex4K Rental Package', rentalStart: new Date('2025-01-01').toISOString(), rentalEnd: addDays(refDate, 29).toISOString(), amount: 75000.0, status: 'Active' }],
      comms: [{ communicationType: 'Call', communicationDate: subDays(refDate, 5).toISOString(), remarks: 'Spoke with assistant. Extension details are being reviewed by Wayne Board.' }],
      renewal: { alertStatus: 'Yellow', renewalStatus: 'Pending', renewalDate: addDays(refDate, 29).toISOString() }
    },
    {
      client: {
        clientName: 'Diana Prince', companyName: 'The Antiquities Registry',
        email: 'diana.prince@registry.org', phone: '+1 (555) 011-5544',
        clientType: 'Other', address: 'National Museum, Washington DC',
        preferredCommunication: 'Email',
        contractStartDate: new Date('2024-01-01T00:00:00Z').toISOString(),
        renewalDate: addDays(refDate, 203).toISOString(),
        status: 'Active', paymentStatus: 'Paid',
        notes: 'Secure Climate-Controlled Storage parameters.'
      },
      preferences: [{ equipmentName: 'Secure Cases and Tracking Mounts', category: 'Audio Equipment' }],
      history: [{ equipmentName: 'Secure Gear Transport Pack', rentalStart: new Date('2024-01-01').toISOString(), rentalEnd: addDays(refDate, 203).toISOString(), amount: 121800.0, status: 'Active' }],
      comms: [],
      renewal: { alertStatus: 'Green', renewalStatus: 'Pending', renewalDate: addDays(refDate, 203).toISOString() }
    },
    {
      client: {
        clientName: 'Tony Stark', companyName: 'Stark Solutions',
        email: 'tony@stark.solutions', phone: '+1 (555) 018-3000',
        clientType: 'Production House', address: '10880 Wilshire Blvd, Los Angeles, CA',
        preferredCommunication: 'Email, WhatsApp',
        contractStartDate: new Date('2026-01-10T00:00:00Z').toISOString(),
        renewalDate: addDays(refDate, 212).toISOString(),
        status: 'Active', paymentStatus: 'Paid',
        notes: 'Requires customized power mounts and high-amp grid connections.'
      },
      preferences: [
        { equipmentName: 'Custom Laser Holographic Projector', category: 'Lighting' },
        { equipmentName: 'Red V-Raptor 8K Camera', category: 'Cameras' }
      ],
      history: [{ equipmentName: 'Arri Cine Gear Set', rentalStart: new Date('2026-01-10').toISOString(), rentalEnd: addDays(refDate, 212).toISOString(), amount: 102000.0, status: 'Active' }],
      comms: [{ communicationType: 'Email', communicationDate: subDays(refDate, 15).toISOString(), remarks: 'Client requested specs sheet for updated 8K sensor modules.' }],
      renewal: { alertStatus: 'Green', renewalStatus: 'Pending', renewalDate: addDays(refDate, 212).toISOString() }
    },
    {
      client: {
        clientName: 'Clark Kent', companyName: 'Metropolis Planet Media',
        email: 'c.kent@planetmedia.com', phone: '+1 (555) 013-9876',
        clientType: 'Videographer', address: '345 Broadway, Metropolis, NY',
        preferredCommunication: 'Email',
        contractStartDate: new Date('2025-09-15T00:00:00Z').toISOString(),
        renewalDate: subDays(refDate, 27).toISOString(),
        status: 'Inactive', paymentStatus: 'Unpaid',
        notes: 'Account suspended temporarily due to billing dispute on extra data usage.'
      },
      preferences: [
        { equipmentName: 'Canon EOS C300 Mark III', category: 'Cameras' },
        { equipmentName: 'Canon CN-E Cine Prime Lenses', category: 'Lenses' }
      ],
      history: [{ equipmentName: 'Canon Broadcast Bundle', rentalStart: new Date('2025-09-15').toISOString(), rentalEnd: subDays(refDate, 27).toISOString(), amount: 25600.0, status: 'Completed' }],
      comms: [
        { communicationType: 'Email', communicationDate: subDays(refDate, 40).toISOString(), remarks: 'Sent pre-expiry warning.' },
        { communicationType: 'Email', communicationDate: subDays(refDate, 28).toISOString(), remarks: 'Sent invoice notice. Account suspended following non-payment.' }
      ],
      renewal: { alertStatus: 'Red', renewalStatus: 'Archived', renewalDate: subDays(refDate, 27).toISOString() }
    }
  ];

  console.log('👥 Seeding clients...');
  for (const cd of clientsData) {
    const { data: client, error: clientErr } = await supabase.from('Client').insert([cd.client]).select().single();
    if (clientErr) { console.error(`  ❌ Error creating ${cd.client.clientName}:`, clientErr.message); continue; }

    if (cd.preferences.length > 0) {
      await supabase.from('EquipmentPreference').insert(cd.preferences.map(p => ({ ...p, clientId: client.id })));
    }
    if (cd.history.length > 0) {
      await supabase.from('RentalHistory').insert(cd.history.map(h => ({ ...h, clientId: client.id })));
    }
    if (cd.comms.length > 0) {
      await supabase.from('CommunicationLog').insert(cd.comms.map(c => ({ ...c, clientId: client.id })));
    }
    await supabase.from('Renewal').insert([{ ...cd.renewal, clientId: client.id }]);

    console.log(`  ✅ Created: ${client.clientName}`);
  }

  // Audit logs
  console.log('📋 Seeding audit logs...');
  await supabase.from('AuditLog').insert([
    { userId: adminUser.id, action: 'Initialized Database with default seed data', timestamp: subDays(refDate, 10).toISOString() },
    { userId: adminUser.id, action: 'Configured default SMTP notification routes', timestamp: subDays(refDate, 8).toISOString() },
    { userId: staffUser.id, action: 'Updated notes for client Sarah Connor', timestamp: subDays(refDate, 4).toISOString() },
    { userId: staffUser.id, action: 'Logged WhatsApp conversation with client Elena Rostova', timestamp: subDays(refDate, 2).toISOString() }
  ]);

  console.log('\n🎉 Supabase database seeding completed successfully!');
  console.log('   Admin login: admin@sddigitals.com / admin123');
  console.log('   Staff login: staff@sddigitals.com / staff123');
}

main().catch(console.error);
