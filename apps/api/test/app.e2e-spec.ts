import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/app.bootstrap';
import { PrismaService } from '../src/database/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.DATABASE_URL ??=
      'postgresql://test:test@localhost:5432/ecommerce_test?schema=public';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect((response: Response) => {
        const body: unknown = response.body;
        expectRecord(body);
        expect(body.success).toBe(true);
        expect(body.data).toEqual({
          name: 'commerce-api',
          version: '1.0.0',
        });
        expect(typeof body.timestamp).toBe('string');
      });
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((response: Response) => {
        const body: unknown = response.body;
        expectRecord(body);
        expectRecord(body.data);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('ok');
        expect(typeof body.data.timestamp).toBe('string');
        expect(typeof body.timestamp).toBe('string');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

function expectRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  expect(typeof value).toBe('object');
  expect(value).not.toBeNull();
}
