import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

// Fix for @typescript-eslint/no-floating-promises warning
void bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
