/**
 * Database Seed — Creates default admin user and settings
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@emailcampaign.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@emailcampaign.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  // Create default settings
  const defaultSettings = [
    { key: 'app_name', value: 'Email Campaign Manager', type: 'string', group: 'general', label: 'Application Name' },
    { key: 'default_batch_size', value: '50', type: 'number', group: 'email', label: 'Default Batch Size' },
    { key: 'default_delay_ms', value: '1000', type: 'number', group: 'email', label: 'Default Delay (ms)' },
    { key: 'max_retry_attempts', value: '3', type: 'number', group: 'email', label: 'Max Retry Attempts' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean', group: 'general', label: 'Maintenance Mode' },
    { key: 'allow_registration', value: 'true', type: 'boolean', group: 'security', label: 'Allow Registration' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`✅ ${defaultSettings.length} default settings created`);
  console.log('\n🎉 Seeding completed!');
  console.log('\n📧 Admin Login:');
  console.log('   Email: admin@emailcampaign.com');
  console.log('   Password: Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
