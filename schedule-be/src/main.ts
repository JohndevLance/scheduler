import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  // ── Swagger ──────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('ShiftSync API')
    .setDescription(
      'Multi-location staff scheduling platform for Coastal Eats restaurant group.\n\n' +
        '**Auth:** Use `POST /auth/login` to obtain a Bearer token, then click **Authorize** above.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('auth', 'Authentication — login, register, token refresh')
    .addTag('users', 'User management, availability, skills')
    .addTag('locations', 'Location CRUD and staff certifications')
    .addTag('shifts', 'Shift scheduling, assignment, publish/unpublish')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `\n🚀  App running at: http://localhost:${process.env.PORT ?? 3000}/api/v1`,
  );
  console.log(
    `📖  Swagger docs:  http://localhost:${process.env.PORT ?? 3000}/api/docs\n`,
  );
}
bootstrap();
