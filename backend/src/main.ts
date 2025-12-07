import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const isLocalNetwork = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);

      if (allowedOrigins.includes(origin) || isLocalNetwork) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Barber Manager API')
    .setDescription('Sistema de gestão para barbearia')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação')
    .addTag('clients', 'Clientes')
    .addTag('barbers', 'Barbeiros')
    .addTag('services', 'Serviços')
    .addTag('products', 'Produtos')
    .addTag('appointments', 'Agendamentos')
    .addTag('checkout', 'Checkout')
    .addTag('financial', 'Financeiro')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Barber Manager API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
