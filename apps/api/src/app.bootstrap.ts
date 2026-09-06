import {
  ExceptionFilter,
  INestApplication,
  NestInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvironmentVariables } from './config/env.validation';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

export function configureApp(app: INestApplication): void {
  const configService =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.enableCors({
    origin: configService.get('WEB_ORIGIN', { infer: true }),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const responseInterceptor: NestInterceptor = new ResponseInterceptor();
  const exceptionFilter: ExceptionFilter = new GlobalExceptionFilter();

  app.useGlobalInterceptors(responseInterceptor);
  app.useGlobalFilters(exceptionFilter);
}

export function configureSwagger(app: INestApplication): void {
  const configService =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  if (configService.get('NODE_ENV', { infer: true }) === 'production') {
    return;
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('API documentation for the E-commerce Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth()
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, documentFactory);
}
