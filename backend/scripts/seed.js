const { dataStore } = require('../services/dataStore');
const { connectDB } = require('../config/db');

const seedMunicipalComplaints = async () => {
  console.log('[CivicLens Seed] Initializing database connection and defaults...');
  await connectDB();
  await dataStore.initDefaults();

  console.log('[CivicLens Seed] Seeding realistic municipal complaints with geotagged coordinates...');

  // Sample master complaints across Bengaluru wards
  const sampleComplaints = [
    {
      trackingId: 'CL-2026-A10101',
      title: 'Deep pothole on Indiranagar 100ft road near KFC junction',
      description: 'Major asphalt crater measuring approx 2 feet wide and 6 inches deep causing traffic bottlenecks and bike skidding.',
      department: 'ROADS',
      category: 'Road Repair',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      location: { type: 'Point', coordinates: [77.6412, 12.9784] },
      address: '100ft Road, Near KFC Junction, Indiranagar, Bengaluru',
      citizenName: 'Kavita Menon',
      citizenPhone: '+91 98450 12345',
      duplicateCount: 2,
      auditTrail: [
        { status: 'SUBMITTED', changedByName: 'Kavita Menon', remarks: 'Grievance lodged with GPS coordinates', timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: 'UNDER_REVIEW', changedByName: 'Roads Officer Rajesh', remarks: 'Site inspection prioritized', timestamp: new Date(Date.now() - 86400000 * 1.5) },
        { status: 'IN_PROGRESS', changedByName: 'Roads Officer Rajesh', remarks: 'Asphalt cold mix and compactor deployed', timestamp: new Date(Date.now() - 86400000 * 0.5) }
      ]
    },
    {
      trackingId: 'CL-2026-A10102',
      title: 'Water main burst flooding 5th Main Koramangala',
      description: 'High pressure drinking water pipe ruptured early morning. Potable water continuously wasting into storm drain.',
      department: 'WATER_SUPPLY',
      category: 'Pipeline Leakage',
      status: 'ASSIGNED',
      priority: 'URGENT',
      location: { type: 'Point', coordinates: [77.6185, 12.9352] },
      address: '5th Main Road, 4th Block, Koramangala, Bengaluru',
      citizenName: 'Sunil Hegde',
      citizenPhone: '+91 98451 23456',
      duplicateCount: 1,
      auditTrail: [
        { status: 'SUBMITTED', changedByName: 'Sunil Hegde', remarks: 'Reported pipeline rupture', timestamp: new Date(Date.now() - 86400000) },
        { status: 'ASSIGNED', changedByName: 'Water Works Officer Anand', remarks: 'Assigned to Ward emergency valve team', timestamp: new Date(Date.now() - 43200000) }
      ]
    },
    {
      trackingId: 'CL-2026-A10103',
      title: 'Overflowing public garbage bin near Malleshwaram 8th Cross',
      description: 'Rotten municipal waste uncollected for 4 days. Stray cattle gathering and foul stench spreading across market.',
      department: 'SANITATION',
      category: 'Solid Waste Management',
      status: 'SUBMITTED',
      priority: 'HIGH',
      location: { type: 'Point', coordinates: [77.5713, 13.0031] },
      address: '8th Cross Market Road, Malleshwaram, Bengaluru',
      citizenName: 'Deepa Rao',
      citizenPhone: '+91 98452 34567',
      duplicateCount: 0,
      auditTrail: [
        { status: 'SUBMITTED', changedByName: 'Deepa Rao', remarks: 'Garbage dump reported', timestamp: new Date() }
      ]
    },
    {
      trackingId: 'CL-2026-A10104',
      title: 'Streetlights malfunctioning on Whitefield Main Road',
      description: 'Continuous stretch of 8 streetlights dark from inner circle to forum value mall. Poses severe safety risk to pedestrians.',
      department: 'ELECTRICITY',
      category: 'Street Lighting',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      location: { type: 'Point', coordinates: [77.7499, 12.9698] },
      address: 'Whitefield Main Road, Near Inner Circle, Bengaluru',
      citizenName: 'Amitabh Sen',
      citizenPhone: '+91 98453 45678',
      duplicateCount: 0,
      resolvedAt: new Date(Date.now() - 3600000 * 5),
      resolutionNotes: 'Blown capacitor in phase transformer box replaced. All 8 LED luminaires tested and functional.',
      auditTrail: [
        { status: 'SUBMITTED', changedByName: 'Amitabh Sen', remarks: 'Streetlights outage reported', timestamp: new Date(Date.now() - 86400000 * 3) },
        { status: 'IN_PROGRESS', changedByName: 'Electricity Officer Sneha', remarks: 'Electrician linework dispatched', timestamp: new Date(Date.now() - 86400000 * 1) },
        { status: 'RESOLVED', changedByName: 'Electricity Officer Sneha', remarks: 'Capacitor replaced and lights verified', timestamp: new Date(Date.now() - 3600000 * 5) }
      ]
    },
    {
      trackingId: 'CL-2026-A10105',
      title: 'Stagnant water and mosquito breeding hazard near BTM Lake park',
      description: 'Clogged roadside ditch filled with black stagnant water. Severe mosquito breeding leading to dengue risk among residents.',
      department: 'HEALTH_SAFETY',
      category: 'Public Health',
      status: 'UNDER_REVIEW',
      priority: 'MEDIUM',
      location: { type: 'Point', coordinates: [77.6101, 12.9166] },
      address: 'Lake Road, BTM 2nd Stage, Bengaluru',
      citizenName: 'Mohammed Farooq',
      citizenPhone: '+91 98454 56789',
      duplicateCount: 0,
      auditTrail: [
        { status: 'SUBMITTED', changedByName: 'Mohammed Farooq', remarks: 'Health grievance submitted', timestamp: new Date(Date.now() - 86400000 * 1.2) }
      ]
    },
    {
      trackingId: 'CL-2026-A10106',
      title: 'Broken children swings and fallen tree branch at Cubbon Park kids zone',
      description: 'Large dry eucalyptus branch fallen directly on the swing set. Metal chains broken and unsafe for children.',
      department: 'PARKS',
      category: 'Park Maintenance',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      location: { type: 'Point', coordinates: [77.5926, 12.9757] },
      address: 'Kids Play Section, Cubbon Park, Bengaluru',
      citizenName: 'Meera Nambiar',
      citizenPhone: '+91 98455 67890',
      duplicateCount: 0,
      auditTrail: [
        { status: 'SUBMITTED', changedByName: 'Meera Nambiar', remarks: 'Park damage reported', timestamp: new Date(Date.now() - 86400000 * 2) },
        { status: 'IN_PROGRESS', changedByName: 'Horticulture Team', remarks: 'Tree branch clearance underway', timestamp: new Date(Date.now() - 86400000 * 0.8) }
      ]
    }
  ];

  for (const c of sampleComplaints) {
    const existing = await dataStore.findComplaintByTrackingId(c.trackingId);
    if (!existing) {
      await dataStore.createComplaint(c);
      console.log(`[CivicLens Seed] Created complaint: ${c.trackingId} - ${c.title}`);
    }
  }

  // Seed duplicate child complaint linked to A10101 (Indiranagar pothole)
  const masterA1 = await dataStore.findComplaintByTrackingId('CL-2026-A10101');
  if (masterA1) {
    const duplicateChild = {
      trackingId: 'CL-2026-DUP01',
      title: 'Huge crater and broken tar near Indiranagar KFC',
      description: 'Huge pothole right outside KFC Indiranagar 100ft road, someone will fall tonight.',
      department: 'ROADS',
      category: 'Road Repair',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      location: { type: 'Point', coordinates: [77.6414, 12.9785] }, // ~22m away
      address: '100ft Road opp KFC, Indiranagar',
      citizenName: 'Rohan Gupta',
      citizenPhone: '+91 98456 78901',
      isDuplicate: true,
      masterComplaintId: masterA1._id || masterA1.id,
      masterTrackingId: masterA1.trackingId,
      similarityScore: 0.74,
      distanceMeters: 22.4,
      auditTrail: [
        { status: 'SUBMITTED', changedByName: 'Rohan Gupta', remarks: 'Clustered automatically as duplicate of CL-2026-A10101 (74% match, 22.4m away)', timestamp: new Date() }
      ]
    };

    const existingDup = await dataStore.findComplaintByTrackingId(duplicateChild.trackingId);
    if (!existingDup) {
      await dataStore.createComplaint(duplicateChild);
      console.log(`[CivicLens Seed] Created duplicate child complaint: ${duplicateChild.trackingId}`);
    }
  }

  console.log('[CivicLens Seed] Database seeding completed successfully.');
};

if (require.main === module) {
  seedMunicipalComplaints()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[CivicLens Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = { seedMunicipalComplaints };
