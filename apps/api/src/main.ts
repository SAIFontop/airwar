// Saif Control System — API Entry Point
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ logger: true }),
    );

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });

    const port = process.env.API_PORT || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`🔥 Saif Control API running on http://0.0.0.0:${port}`);
    console.log(`📡 GraphQL playground: http://0.0.0.0:${port}/graphql`);
}

bootstrap();
