import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { configureApp, configureSwagger } from './app.bootstrap';
import { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  configureSwagger(app);

  const configService =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const port = configService.get('PORT', { infer: true });

  await app.listen(port);
}

void bootstrap();
