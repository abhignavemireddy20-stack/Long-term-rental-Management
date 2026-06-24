import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// Helper to normalize active rentals to monthly rate
function calculateClientMonthlyRate(client, status) {
  const currentStatus = status || client.status;
  if (currentStatus === 'Expired' || currentStatus === 'Inactive' || currentStatus === 'Suspended') {
    return 0;
  }
  
  // Sum monthly values from active rental histories
  const activeRentals = client.rentalHistory.filter(h => h.status === 'Active');
  if (activeRentals.length === 0) {
    // Fallback: use a default rate based on clientType if no active rental record exists
    const baseRates = {
      'Production House': 5000,
      'Wedding Photographer': 1500,
      'YouTuber': 800,
      'Videographer': 1200,
      'Event Company': 3500,
      'Other': 1000
    };
    return baseRates[client.clientType] || 1000;
  }

  let totalMonthlyRate = 0;
  activeRentals.forEach(rental => {
    const start = new Date(rental.rentalStart);
    const end = new Date(rental.rentalEnd);
    const diffTime = Math.max(1, end.getTime() - start.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const months = diffDays / 30.4; // Average days in month
    
    totalMonthlyRate += rental.amount / Math.max(0.5, months);
  });

  return Math.round(totalMonthlyRate);
}

// GET all dashboard and reports analytics
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { referenceDate, filterRange, customStart, customEnd } = req.query;
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    ref.setHours(0,0,0,0);

    // Fetch all client data with relations via Supabase
    const { data: allClients, error: clientsErr } = await supabase
      .from('Client')
      .select('*, equipmentPreferences:EquipmentPreference(*), rentalHistory:RentalHistory(*)');

    if (clientsErr) throw clientsErr;

    let startDate, endDate;
    if (filterRange === 'Daily') {
      startDate = new Date(ref);
      startDate.setHours(0,0,0,0);
      endDate = new Date(ref);
      endDate.setHours(23,59,59,999);
    } else if (filterRange === 'Weekly') {
      // Start of the week containing ref
      startDate = new Date(ref);
      startDate.setDate(ref.getDate() - ref.getDay());
      startDate.setHours(0,0,0,0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23,59,59,999);
    } else if (filterRange === 'Yearly') {
      startDate = new Date(ref.getFullYear(), 0, 1);
      endDate = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (filterRange === 'Custom') {
      startDate = customStart ? new Date(customStart) : new Date(0);
      startDate.setHours(0,0,0,0);
      endDate = customEnd ? new Date(customEnd) : new Date(ref);
      endDate.setHours(23,59,59,999);
    } else {
      // Default to Monthly
      startDate = new Date(ref.getFullYear(), ref.getMonth(), 1);
      endDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Filter clients active during the selected [startDate, endDate] range
    const filteredClients = allClients.filter(c => {
      const contractStart = new Date(c.contractStartDate);
      const contractEnd = new Date(c.renewalDate);
      return contractStart <= endDate && contractEnd >= startDate;
    });

    // 1. KPI Summaries
    const totalClients = filteredClients.length;
    
    // Status counts relative to referenceDate
    const statusCounts = { Active: 0, ExpiringSoon: 0, Expired: 0, Inactive: 0 };
    let totalRevenueRate = 0;

    filteredClients.forEach(c => {
      // Calculate days remaining relative to referenceDate
      const expiry = new Date(c.renewalDate);
      expiry.setHours(0,0,0,0);
      const today = new Date(ref);
      today.setHours(0,0,0,0);
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let computedStatus = c.status;
      if (c.status !== 'Suspended' && c.status !== 'Inactive') {
        if (diffDays < 0) {
          computedStatus = 'Expired';
        } else if (diffDays <= 30) {
          computedStatus = 'ExpiringSoon';
        } else {
          computedStatus = 'Active';
        }
      } else {
        computedStatus = 'Inactive';
      }

      statusCounts[computedStatus]++;
      
      // Scale rate depending on filterRange
      let rate = calculateClientMonthlyRate(c, computedStatus);
      if (filterRange === 'Weekly') {
        rate = rate / (30.4 / 7);
      } else if (filterRange === 'Yearly') {
        rate = rate * 12;
      } else if (filterRange === 'Daily') {
        rate = rate / 30.4;
      }
      totalRevenueRate += rate;
    });
    totalRevenueRate = Math.round(totalRevenueRate);

    // 2. Client Type Distribution (Bar Chart)
    const types = ['Production House', 'Wedding Photographer', 'YouTuber', 'Videographer', 'Event Company', 'Other'];
    const typeDistribution = types.map(t => {
      const count = filteredClients.filter(c => c.clientType === t).length;
      return { type: t, count };
    });

    // 3. Status Split (Doughnut Chart)
    const statusSplit = [
      { status: 'Active', count: statusCounts.Active, color: '#10B981' },
      { status: 'Expiring Soon', count: statusCounts.ExpiringSoon, color: '#F59E0B' },
      { status: 'Expired', count: statusCounts.Expired, color: '#EF4444' },
      { status: 'Inactive', count: statusCounts.Inactive, color: '#64748B' }
    ];

    // 4. Monthly Signup Growth (Line Chart)
    const signupGrowth = [];
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formatDateLabel = (date, mode) => {
      if (mode === 'Daily') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (mode === 'Weekly') {
        return `Wk of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (mode === 'Yearly') {
        return `${date.getFullYear()}`;
      } else {
        return `${monthsName[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
      }
    };

    if (filterRange === 'Custom') {
      const start = startDate;
      const end = endDate;
      const duration = end.getTime() - start.getTime();
      
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(start.getTime() + (5 - i) * (duration / 5 || 1));
        const label = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
        
        const count = allClients.filter(c => {
          const reg = new Date(c.contractStartDate);
          return reg <= targetDate;
        }).length;
        
        signupGrowth.push({ month: label, cumulativeClients: count });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        let targetDate;
        if (filterRange === 'Daily') {
          targetDate = new Date(ref);
          targetDate.setDate(ref.getDate() - i);
          targetDate.setHours(23,59,59,999);
        } else if (filterRange === 'Weekly') {
          targetDate = new Date(ref);
          targetDate.setDate(ref.getDate() - i * 7);
          targetDate.setHours(23,59,59,999);
        } else if (filterRange === 'Yearly') {
          targetDate = new Date(ref.getFullYear() - i, 11, 31, 23,59,59,999);
        } else {
          targetDate = new Date(ref.getFullYear(), ref.getMonth() - i + 1, 0, 23,59,59,999);
        }
        
        const label = formatDateLabel(targetDate, filterRange);
        
        const count = allClients.filter(c => {
          const reg = new Date(c.contractStartDate);
          return reg <= targetDate;
        }).length;
        
        signupGrowth.push({ month: label, cumulativeClients: count });
      }
    }

    // 5. Projected Expirations Runway & 6. Projected Revenue Runway Decay
    const projectedExpirations = [];
    const revenueRunwayDecay = [];

    if (filterRange === 'Custom') {
      const start = startDate;
      const end = endDate;
      const duration = end.getTime() - start.getTime();
      
      for (let i = 0; i < 6; i++) {
        const intervalStart = new Date(start.getTime() + i * (duration / 6 || 1));
        const intervalEnd = new Date(start.getTime() + (i + 1) * (duration / 6 || 1));
        const label = intervalStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
        
        const expirationsCount = allClients.filter(c => {
          if (c.status === 'Suspended' || c.status === 'Inactive') return false;
          const expiry = new Date(c.renewalDate);
          return expiry >= intervalStart && expiry < intervalEnd;
        }).length;
        
        projectedExpirations.push({ month: label, count: expirationsCount });

        const activeRevenue = allClients
          .filter(c => {
            if (c.status === 'Suspended' || c.status === 'Inactive') return false;
            const expiry = new Date(c.renewalDate);
            return expiry >= intervalStart;
          })
          .reduce((sum, c) => sum + calculateClientMonthlyRate(c, c.status), 0);
          
        revenueRunwayDecay.push({ month: label, projectedRevenue: activeRevenue });
      }
    } else {
      for (let i = 0; i < 6; i++) {
        let intervalStart, intervalEnd;
        if (filterRange === 'Daily') {
          intervalStart = new Date(ref);
          intervalStart.setDate(ref.getDate() + i);
          intervalStart.setHours(0,0,0,0);
          
          intervalEnd = new Date(intervalStart);
          intervalEnd.setHours(23,59,59,999);
        } else if (filterRange === 'Weekly') {
          intervalStart = new Date(ref);
          intervalStart.setDate(ref.getDate() + i * 7);
          intervalStart.setHours(0,0,0,0);
          
          intervalEnd = new Date(intervalStart);
          intervalEnd.setDate(intervalStart.getDate() + 6);
          intervalEnd.setHours(23,59,59,999);
        } else if (filterRange === 'Yearly') {
          intervalStart = new Date(ref.getFullYear() + i, 0, 1);
          intervalEnd = new Date(ref.getFullYear() + i, 11, 31, 23, 59, 59, 999);
        } else {
          intervalStart = new Date(ref.getFullYear(), ref.getMonth() + i, 1);
          intervalEnd = new Date(ref.getFullYear(), ref.getMonth() + i + 1, 0, 23, 59, 59, 999);
        }
        
        const label = formatDateLabel(intervalStart, filterRange);
        
        const expirationsCount = allClients.filter(c => {
          if (c.status === 'Suspended' || c.status === 'Inactive') return false;
          const expiry = new Date(c.renewalDate);
          return expiry >= intervalStart && expiry <= intervalEnd;
        }).length;
        
        projectedExpirations.push({ month: label, count: expirationsCount });

        let activeRevenue = allClients
          .filter(c => {
            if (c.status === 'Suspended' || c.status === 'Inactive') return false;
            const expiry = new Date(c.renewalDate);
            return expiry >= intervalStart;
          })
          .reduce((sum, c) => {
            let rate = calculateClientMonthlyRate(c, c.status);
            if (filterRange === 'Weekly') {
              rate = rate / (30.4 / 7);
            } else if (filterRange === 'Yearly') {
              rate = rate * 12;
            } else if (filterRange === 'Daily') {
              rate = rate / 30.4;
            }
            return sum + rate;
          }, 0);
          
        revenueRunwayDecay.push({ month: label, projectedRevenue: Math.round(activeRevenue) });
      }
    }

    // 7. Equipment Category Distribution (Doughnut Chart of Equipment preferences)
    const categories = ['Cameras', 'Lenses', 'Lighting', 'Audio Equipment'];
    const equipmentUtilization = categories.map(cat => {
      const count = filteredClients.reduce((sum, c) => {
        return sum + c.equipmentPreferences.filter(p => p.category === cat).length;
      }, 0);
      return { category: cat, count };
    });

    // 8. Top 5 Most Popular Gear items
    const gearCounts = {};
    filteredClients.forEach(c => {
      c.equipmentPreferences.forEach(p => {
        gearCounts[p.equipmentName] = (gearCounts[p.equipmentName] || 0) + 1;
      });
    });
    const topGear = Object.entries(gearCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      kpis: {
        totalClients,
        activeClients: statusCounts.Active + statusCounts.ExpiringSoon,
        expiringSoon: statusCounts.ExpiringSoon,
        expiredContracts: statusCounts.Expired,
        monthlyRevenue: totalRevenueRate
      },
      charts: {
        signupGrowth,
        typeDistribution,
        statusSplit,
        projectedExpirations,
        revenueRunwayDecay,
        equipmentUtilization,
        topGear
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
