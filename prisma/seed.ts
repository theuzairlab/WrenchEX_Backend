import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample categories
  const autoPartsCategory = await prisma.category.upsert({
    where: { id: 'auto-parts-main' },
    update: {},
    create: {
      id: 'auto-parts-main',
      name: 'Auto Parts',
      description: 'Automobile spare parts and components',
      isActive: true
    }
  });

  const servicesCategory = await prisma.category.upsert({
    where: { id: 'services-main' },
    update: {},
    create: {
      id: 'services-main',
      name: 'Services',
      description: 'Automobile repair and maintenance services',
      isActive: true
    }
  });

  // Create subcategories for Auto Parts
  const engineParts = await prisma.category.upsert({
    where: { id: 'engine-parts' },
    update: {},
    create: {
      id: 'engine-parts',
      name: 'Engine Parts',
      description: 'Engine components and accessories',
      parentId: autoPartsCategory.id,
      isActive: true
    }
  });

  const brakeParts = await prisma.category.upsert({
    where: { id: 'brake-parts' },
    update: {},
    create: {
      id: 'brake-parts',
      name: 'Brake Parts',
      description: 'Brake system components',
      parentId: autoPartsCategory.id,
      isActive: true
    }
  });

  const suspension = await prisma.category.upsert({
    where: { id: 'suspension' },
    update: {},
    create: {
      id: 'suspension',
      name: 'Suspension',
      description: 'Suspension system parts',
      parentId: autoPartsCategory.id,
      isActive: true
    }
  });

  const electrical = await prisma.category.upsert({
    where: { id: 'electrical' },
    update: {},
    create: {
      id: 'electrical',
      name: 'Electrical',
      description: 'Electrical components and accessories',
      parentId: autoPartsCategory.id,
      isActive: true
    }
  });

  // Create subcategories for Services
  const maintenance = await prisma.category.upsert({
    where: { id: 'maintenance' },
    update: {},
    create: {
      id: 'maintenance',
      name: 'Maintenance',
      description: 'Regular maintenance services',
      parentId: servicesCategory.id,
      isActive: true
    }
  });

  const repairs = await prisma.category.upsert({
    where: { id: 'repairs' },
    update: {},
    create: {
      id: 'repairs',
      name: 'Repairs',
      description: 'Repair and diagnostic services',
      parentId: servicesCategory.id,
      isActive: true
    }
  });

  const bodyWork = await prisma.category.upsert({
    where: { id: 'body-work' },
    update: {},
    create: {
      id: 'body-work',
      name: 'Body Work',
      description: 'Body repair and painting services',
      parentId: servicesCategory.id,
      isActive: true
    }
  });

  // Create more specific subcategories
  await prisma.category.createMany({
    data: [
      // Engine subcategories
      {
        id: 'pistons',
        name: 'Pistons',
        description: 'Engine pistons and rings',
        parentId: engineParts.id,
        isActive: true
      },
      {
        id: 'filters',
        name: 'Filters',
        description: 'Oil, air, and fuel filters',
        parentId: engineParts.id,
        isActive: true
      },
      // Brake subcategories
      {
        id: 'brake-pads',
        name: 'Brake Pads',
        description: 'Brake pads for all vehicle types',
        parentId: brakeParts.id,
        isActive: true
      },
      {
        id: 'brake-discs',
        name: 'Brake Discs',
        description: 'Brake discs and rotors',
        parentId: brakeParts.id,
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created categories:');
  console.log(`  - ${autoPartsCategory.name} (${engineParts.name}, ${brakeParts.name}, ${suspension.name}, ${electrical.name})`);
  console.log(`  - ${servicesCategory.name} (${maintenance.name}, ${repairs.name}, ${bodyWork.name})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 