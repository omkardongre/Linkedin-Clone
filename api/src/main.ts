// Load environment variables manually before anything else
import * as dotenv from 'dotenv';

// Load .env.test if NODE_ENV=test, otherwise load .env
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
  console.log('Loaded environment from .env.test');
} else {
  dotenv.config({ path: '.env' });
  console.log('Loaded environment from .env');
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as morgan from 'morgan';
import { ValidationPipe } from '@nestjs/common';

const logStream = fs.createWriteStream('api.log', { flags: 'a' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.use(morgan('combined', { stream: logStream }));
  await app.listen(3000);
}
bootstrap();
