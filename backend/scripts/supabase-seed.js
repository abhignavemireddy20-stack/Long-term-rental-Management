import 'dotenv/config';
import fs from 'fs';
import path from 'url';
import fileFs from 'fs';
import filePath from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = filePath.dirname(__filename);

// Read env variables
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment variables.");
  process.exit(1);
}

const mockDataPath = filePath.join(__dirname, '../config/mock-firestore.json');
const mockData = JSON.parse(fileFs.readFileSync(mockDataPath, 'utf8'));

// Helper to make HTTPS requests to Supabase REST API
async function postData(tableName, records) {
  const url = `${supabaseUrl}/rest/v1/${tableName}`;
  console.log(`Sending ${records.length} records to table "${tableName}"...`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates' // Suppresses errors on duplicate keys, updates/merges them instead
    },
    body: JSON.stringify(records)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to insert into ${tableName}: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  console.log(`✅ SUCCESS: Seeded table "${tableName}"`);
}

async function run() {
  try {
    console.log("🚀 Starting remote seeding to Supabase over HTTPS (port 443)...");

    // 1. Users
    const users = Object.entries(mockData.users).map(([id, val]) => ({
      id,
      name: val.name,
      email: val.email,
      password: val.password,
      role: val.role,
      createdAt: val.createdAt
    }));
    await postData('User', users);
    
    // 2. Clients
    const clients = Object.entries(mockData.clients).map(([id, val]) => ({
      id,
      clientName: val.clientName,
      companyName: val.companyName || null,
      clientType: val.clientType,
      phone: val.phone,
      email: val.email,
      address: val.address || null,
      preferredCommunication: val.preferredCommunication,
      contractStartDate: val.contractStartDate,
      renewalDate: val.renewalDate,
      status: val.status,
      notes: val.notes || null
    }));
    await postData('Client', clients);
    
    // 3. EquipmentPreferences
    const prefs = [];
    // 4. RentalHistory
    const history = [];
    // 5. CommunicationLogs
    const comms = [];
    // 6. Renewals
    const renewals = [];
    
    Object.entries(mockData.clients).forEach(([clientId, clientVal]) => {
      if (clientVal.equipmentPreferences) {
        clientVal.equipmentPreferences.forEach((pref, index) => {
          prefs.push({
            id: pref.id || `pref-${clientId}-${index}`,
            clientId,
            equipmentName: pref.equipmentName,
            category: pref.category
          });
        });
      }
      
      if (clientVal.rentalHistory) {
        clientVal.rentalHistory.forEach((rent, index) => {
          history.push({
            id: rent.id || `rent-${clientId}-${index}`,
            clientId,
            equipmentName: rent.equipmentName,
            rentalStart: rent.rentalStart,
            rentalEnd: rent.rentalEnd,
            amount: Number(rent.amount),
            status: rent.status
          });
        });
      }
      
      if (clientVal.communicationLogs) {
        clientVal.communicationLogs.forEach((comm, index) => {
          comms.push({
            id: comm.id || `comm-${clientId}-${index}`,
            clientId,
            communicationType: comm.communicationType,
            communicationDate: comm.communicationDate,
            remarks: comm.remarks
          });
        });
      }
      
      if (clientVal.renewals) {
        clientVal.renewals.forEach((ren, index) => {
          renewals.push({
            id: ren.id || `ren-${clientId}-${index}`,
            clientId,
            renewalDate: ren.renewalDate,
            alertStatus: ren.alertStatus,
            renewalStatus: ren.renewalStatus
          });
        });
      }
    });
    
    if (prefs.length > 0) await postData('EquipmentPreference', prefs);
    if (history.length > 0) await postData('RentalHistory', history);
    if (comms.length > 0) await postData('CommunicationLog', comms);
    if (renewals.length > 0) await postData('Renewal', renewals);
    
    // 7. AuditLogs
    const auditLogs = Object.entries(mockData.auditLogs).map(([id, val]) => ({
      id,
      userId: val.userId,
      action: val.action,
      timestamp: val.timestamp
    }));
    await postData('AuditLog', auditLogs);
    
    console.log("🎉 Seeding completed successfully over HTTPS REST API!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

run();
