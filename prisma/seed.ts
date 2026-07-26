import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  users,
  counselorProfiles,
  counselorSchedules,
  specializations,
  counselorSpecializations,
  appointmentSessionTypes,
  sessionTypeConfigs,
  appointments,
  paymentProofs,
  reviews,
  notifications,
} from './data';

const SALT_ROUNDS = 12;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function hashPasswords(usersData: typeof users): Promise<typeof users> {
  return Promise.all(
    usersData.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, SALT_ROUNDS),
    })),
  );
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Clean existing data (in reverse dependency order)
  console.log('Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.paymentProof.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.sessionTypeConfig.deleteMany();
  await prisma.counselorSpecialization.deleteMany();
  await prisma.counselorSchedule.deleteMany();
  await prisma.counselorProfile.deleteMany();
  await prisma.appointmentSessionType.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash passwords and seed Users (without counselorId first to avoid circular FK dependency)
  console.log('Hashing passwords...');
  const usersWithHashedPasswords = await hashPasswords(users);
  const usersWithoutCounselorId = usersWithHashedPasswords.map(
    ({ counselorId, ...rest }) => rest,
  );
  await prisma.user.createMany({ data: usersWithoutCounselorId as any });
  console.log(
    `✓ Seeded ${users.length} users (passwords hashed with bcrypt, ${SALT_ROUNDS} rounds)`,
  );

  // 3. Seed Specializations
  await prisma.specialization.createMany({ data: specializations as any });
  console.log(`✓ Seeded ${specializations.length} specializations`);

  // 4. Seed AppointmentSessionTypes
  await prisma.appointmentSessionType.createMany({
    data: appointmentSessionTypes as any,
  });
  console.log(
    `✓ Seeded ${appointmentSessionTypes.length} appointment session types`,
  );

  // 5. Seed CounselorProfiles
  await prisma.counselorProfile.createMany({ data: counselorProfiles as any });
  console.log(`✓ Seeded ${counselorProfiles.length} counselor profiles`);

  // 6. Update counselor users with counselorId (resolves circular reference)
  const counselorUsers = users.filter((u) => u.counselorId);
  for (const user of counselorUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: { counselorId: user.counselorId },
    });
  }
  console.log(`✓ Linked ${counselorUsers.length} users to counselor profiles`);

  // 7. Seed CounselorSchedules
  await prisma.counselorSchedule.createMany({
    data: counselorSchedules as any,
  });
  console.log(`✓ Seeded ${counselorSchedules.length} counselor schedules`);

  // 8. Seed CounselorSpecializations
  await prisma.counselorSpecialization.createMany({
    data: counselorSpecializations as any,
  });
  console.log(
    `✓ Seeded ${counselorSpecializations.length} counselor specializations`,
  );

  // 9. Seed SessionTypeConfigs
  await prisma.sessionTypeConfig.createMany({
    data: sessionTypeConfigs as any,
  });
  console.log(`✓ Seeded ${sessionTypeConfigs.length} session type configs`);

  // 10. Seed Appointments
  await prisma.appointment.createMany({ data: appointments as any });
  console.log(`✓ Seeded ${appointments.length} appointments`);

  // 11. Seed PaymentProofs
  await prisma.paymentProof.createMany({ data: paymentProofs as any });
  console.log(`✓ Seeded ${paymentProofs.length} payment proofs`);

  // 12. Seed Reviews
  await prisma.review.createMany({ data: reviews as any });
  console.log(`✓ Seeded ${reviews.length} reviews`);

  // 13. Seed Notifications
  await prisma.notification.createMany({ data: notifications as any });
  console.log(`✓ Seeded ${notifications.length} notifications`);

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
