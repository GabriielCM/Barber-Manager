import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToPackages() {
  console.log('Starting migration to package-based subscriptions...\n');

  try {
    // Step 1: Get all unique service+planType combinations from existing subscriptions
    const uniqueCombinations = await prisma.subscription.findMany({
      where: {
        serviceId: { not: null },
        packageId: null,
      },
      select: {
        serviceId: true,
        planType: true,
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      distinct: ['serviceId', 'planType'],
    });

    console.log(`Found ${uniqueCombinations.length} unique service+planType combinations`);

    // Step 2: Create legacy packages
    const packagesCreated = [];
    for (const combo of uniqueCombinations) {
      if (!combo.service) continue;

      const planTypeLabel = combo.planType === 'WEEKLY' ? 'Semanal' : 'Quinzenal';
      const packageName = `Pacote ${combo.service.name} - ${planTypeLabel}`;

      console.log(`Creating package: ${packageName}`);

      const newPackage = await prisma.package.create({
        data: {
          name: packageName,
          description: 'Pacote criado automaticamente na migração de dados',
          planType: combo.planType,
          basePrice: combo.service.price,
          discountAmount: 0,
          finalPrice: combo.service.price,
          isActive: true,
          services: {
            create: {
              serviceId: combo.service.id,
            },
          },
        },
      });

      packagesCreated.push({
        packageId: newPackage.id,
        serviceId: combo.service.id,
        planType: combo.planType,
      });
    }

    console.log(`\nCreated ${packagesCreated.length} legacy packages\n`);

    // Step 3: Update subscriptions to use packageId
    let subscriptionsUpdated = 0;
    for (const pkg of packagesCreated) {
      const result = await prisma.subscription.updateMany({
        where: {
          serviceId: pkg.serviceId,
          planType: pkg.planType,
          packageId: null,
        },
        data: {
          packageId: pkg.packageId,
        },
      });

      subscriptionsUpdated += result.count;
      console.log(
        `Updated ${result.count} subscriptions for service ${pkg.serviceId} (${pkg.planType})`,
      );
    }

    console.log(`\nTotal subscriptions migrated: ${subscriptionsUpdated}\n`);

    // Step 4: Create AppointmentService entries for existing appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        serviceId: { not: null },
      },
      select: {
        id: true,
        serviceId: true,
      },
    });

    console.log(`Found ${appointments.length} appointments to migrate`);

    let appointmentServicesCreated = 0;
    for (const appointment of appointments) {
      if (!appointment.serviceId) continue;

      // Check if already exists
      const exists = await prisma.appointmentService.findUnique({
        where: {
          appointmentId_serviceId: {
            appointmentId: appointment.id,
            serviceId: appointment.serviceId,
          },
        },
      });

      if (!exists) {
        await prisma.appointmentService.create({
          data: {
            appointmentId: appointment.id,
            serviceId: appointment.serviceId,
          },
        });
        appointmentServicesCreated++;
      }
    }

    console.log(`\nCreated ${appointmentServicesCreated} appointment service relations\n`);

    // Step 5: Verification
    console.log('='.repeat(50));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(50));

    const totalPackages = await prisma.package.count({
      where: {
        description: 'Pacote criado automaticamente na migração de dados',
      },
    });
    console.log(`✓ Legacy packages created: ${totalPackages}`);

    const migratedSubs = await prisma.subscription.count({
      where: { packageId: { not: null } },
    });
    console.log(`✓ Subscriptions migrated: ${migratedSubs}`);

    const pendingSubs = await prisma.subscription.count({
      where: {
        serviceId: { not: null },
        packageId: null,
      },
    });
    console.log(`${pendingSubs === 0 ? '✓' : '⚠'} Subscriptions pending: ${pendingSubs}`);

    const totalAppointmentServices = await prisma.appointmentService.count();
    console.log(`✓ Appointment services created: ${totalAppointmentServices}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToPackages()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
