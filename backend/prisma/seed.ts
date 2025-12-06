import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barber.com' },
    update: {},
    create: {
      email: 'admin@barber.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Criar categorias de produtos
  const categories = await Promise.all([
    prisma.productCategory.upsert({
      where: { name: 'Pomadas' },
      update: {},
      create: { name: 'Pomadas' },
    }),
    prisma.productCategory.upsert({
      where: { name: 'Shampoos' },
      update: {},
      create: { name: 'Shampoos' },
    }),
    prisma.productCategory.upsert({
      where: { name: 'Óleos para Barba' },
      update: {},
      create: { name: 'Óleos para Barba' },
    }),
    prisma.productCategory.upsert({
      where: { name: 'Acessórios' },
      update: {},
      create: { name: 'Acessórios' },
    }),
  ]);
  console.log('✅ Product categories created');

  // Criar produtos
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Pomada Matte',
        description: 'Pomada com acabamento fosco e fixação forte',
        categoryId: categories[0].id,
        quantity: 25,
        minQuantity: 5,
        costPrice: 20,
        salePrice: 45,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pomada Brilho',
        description: 'Pomada com acabamento brilhante',
        categoryId: categories[0].id,
        quantity: 20,
        minQuantity: 5,
        costPrice: 18,
        salePrice: 40,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Shampoo Anticaspa',
        description: 'Shampoo especial para tratamento de caspa',
        categoryId: categories[1].id,
        quantity: 15,
        minQuantity: 3,
        costPrice: 25,
        salePrice: 55,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Óleo para Barba Premium',
        description: 'Óleo hidratante para barba com fragrância masculina',
        categoryId: categories[2].id,
        quantity: 30,
        minQuantity: 5,
        costPrice: 15,
        salePrice: 35,
      },
    }),
  ]);
  console.log('✅ Products created');

  // Criar serviços
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Corte Masculino',
        description: 'Corte tradicional masculino com máquina e tesoura',
        price: 45,
        duration: 30,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Barba Completa',
        description: 'Barba com navalha, toalha quente e hidratação',
        price: 35,
        duration: 25,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Corte + Barba',
        description: 'Combo completo de corte masculino e barba',
        price: 70,
        duration: 50,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Pigmentação',
        description: 'Pigmentação capilar para cobrir falhas',
        price: 80,
        duration: 45,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Sobrancelha',
        description: 'Design e alinhamento de sobrancelha',
        price: 20,
        duration: 15,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Hidratação Capilar',
        description: 'Tratamento de hidratação profunda',
        price: 40,
        duration: 30,
      },
    }),
  ]);
  console.log('✅ Services created');

  // Criar barbeiros
  const barbers = await Promise.all([
    prisma.barber.create({
      data: {
        name: 'Carlos Silva',
        phone: '11999990001',
        email: 'carlos@barber.com',
        specialties: ['Corte', 'Barba', 'Pigmentação'],
      },
    }),
    prisma.barber.create({
      data: {
        name: 'João Santos',
        phone: '11999990002',
        email: 'joao@barber.com',
        specialties: ['Corte', 'Barba'],
      },
    }),
    prisma.barber.create({
      data: {
        name: 'Pedro Oliveira',
        phone: '11999990003',
        email: 'pedro@barber.com',
        specialties: ['Corte', 'Degradê', 'Desenho'],
      },
    }),
  ]);
  console.log('✅ Barbers created');

  // Vincular serviços aos barbeiros
  for (const barber of barbers) {
    for (const service of services.slice(0, 4)) {
      await prisma.barberService.create({
        data: {
          barberId: barber.id,
          serviceId: service.id,
        },
      });
    }
  }
  console.log('✅ Barber-Service relations created');

  // Criar clientes
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Marcos Pereira',
        phone: '11988880001',
        email: 'marcos@email.com',
        birthDate: new Date('1990-05-15'),
        observations: 'Prefere o barbeiro Carlos. Corte degradê baixo.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Rafael Costa',
        phone: '11988880002',
        email: 'rafael@email.com',
        birthDate: new Date('1985-08-22'),
        observations: 'Alergia a produtos com álcool.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Lucas Ferreira',
        phone: '11988880003',
        email: 'lucas@email.com',
        birthDate: new Date('1992-12-10'),
      },
    }),
    prisma.client.create({
      data: {
        name: 'André Almeida',
        phone: '11988880004',
        birthDate: new Date('1988-03-25'),
        observations: 'Cliente VIP. Sempre faz corte + barba.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Bruno Martins',
        phone: '11988880005',
        email: 'bruno@email.com',
      },
    }),
  ]);
  console.log('✅ Clients created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
