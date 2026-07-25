export const sessionTypeConfigs = [
  // Counselor 1: Online (tier 3, 350000) + Offline (tier 3, 400000)
  {
    id: "stc-1",
    counselorId: "counselor-1",
    sessionType: "ONLINE",
    appointmentSessionTypeId: "stype-5",
    clinicAddress: null,
    createdAt: new Date("2025-06-01T10:00:00Z"),
    updatedAt: new Date("2025-06-01T10:00:00Z"),
    createdBy: "system",
    updatedBy: "system",
  },
  {
    id: "stc-2",
    counselorId: "counselor-1",
    sessionType: "OFFLINE",
    appointmentSessionTypeId: "stype-6",
    clinicAddress: "Jl. Sudirman No. 12, Jakarta Pusat",
    createdAt: new Date("2025-06-01T10:00:00Z"),
    updatedAt: new Date("2025-06-01T10:00:00Z"),
    createdBy: "system",
    updatedBy: "system",
  },
  // Counselor 2: Online only (tier 2, 300000)
  {
    id: "stc-3",
    counselorId: "counselor-2",
    sessionType: "ONLINE",
    appointmentSessionTypeId: "stype-3",
    clinicAddress: null,
    createdAt: new Date("2025-06-01T10:00:00Z"),
    updatedAt: new Date("2025-06-01T10:00:00Z"),
    createdBy: "system",
    updatedBy: "system",
  },
  // Counselor 3: Offline only (tier 2, 250000)
  {
    id: "stc-4",
    counselorId: "counselor-3",
    sessionType: "OFFLINE",
    appointmentSessionTypeId: "stype-4",
    clinicAddress: "Jl. Gatot Subroto No. 7, Jakarta Selatan",
    createdAt: new Date("2025-06-01T10:00:00Z"),
    updatedAt: new Date("2025-06-01T10:00:00Z"),
    createdBy: "system",
    updatedBy: "system",
  },
];
