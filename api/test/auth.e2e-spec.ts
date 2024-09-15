import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { cleanupDatabase } from './utils/database-cleaner';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const mockUser = {
    firstName: 'ram',
    lastName: 'patil',
    email: 'ram.patil@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
    await cleanupDatabase(dataSource);
  });

  afterAll(async () => {
    await cleanupDatabase(dataSource);
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockUser)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: 'user',
      });
      expect(response.body.password).toBeUndefined();
      expect(response.body.imagePath).toBeNull();
    });

    it('should not register a user if email already exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockUser);
      expect(HttpStatus.CONFLICT);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return JWT token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: mockUser.password })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('token');
      expect(
        jwt.verify(response.body.token, process.env.JWT_SECRET),
      ).toBeTruthy();
    });

    it('should not login for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password' })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBe('Email not found');
    });

    it('should not login for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'wrongpassword' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe('Invalid password');
    });
  });
});
