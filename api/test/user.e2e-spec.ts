import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/models/user.interface';
import { cleanupDatabase } from './utils/database-cleaner';
import * as path from 'path';
import * as fs from 'fs';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let userId: string;
  let fileName: string;

  const mockUser: User = {
    firstName: 'arnav',
    lastName: 'shinde',
    email: 'arnav.shinde@example.com',
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

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(mockUser)
      .expect(HttpStatus.CREATED);

    userId = registerResponse.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: mockUser.email, password: mockUser.password })
      .expect(HttpStatus.OK);

    jwtToken = loginResponse.body.token;
  });

  afterAll(async () => {
    const filePath = path.join(__dirname, '../images', fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await cleanupDatabase(dataSource);
    await app.close();
  });

  describe('GET /user/:id', () => {
    it('should get a user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/${userId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(HttpStatus.OK);

      const { id, email, firstName, lastName } = response.body;
      expect(id).toBe(userId);
      expect(email).toEqual(mockUser.email);
      expect(firstName).toEqual(mockUser.firstName);
      expect(lastName).toEqual(mockUser.lastName);
    });

    it('should return 404 if user not found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/9999`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toEqual('User not found');
    });
  });

  describe('POST /user/upload', () => {
    it('should upload an image', async () => {
      const filePath = path.join(
        __dirname,
        '../images/test-assets/test-image.png',
      );
      const response = await request(app.getHttpServer())
        .post('/user/upload')
        .set('Authorization', `Bearer ${jwtToken}`)
        .attach('file', filePath)
        .expect(HttpStatus.CREATED);
      expect(response.body).toHaveProperty('modifiedFileName');
      mockUser.imagePath = response.body.modifiedFileName;
      fileName = response.body.modifiedFileName;
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app.getHttpServer())
        .post('/user/upload')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('No file uploaded');
    });

    it('should return 400 if file content does not match extension', async () => {
      const filePath = path.join(
        __dirname,
        '../images/test-assets/invalid-image.png',
      );
      const response = await request(app.getHttpServer())
        .post('/user/upload')
        .set('Authorization', `Bearer ${jwtToken}`)
        .attach('file', filePath)
        .expect(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual(
        'File content does not match extension',
      );
    });
  });

  describe('GET /user/image-name', () => {
    it('should get the image name of the user', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/image-name')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('imageName');
      expect(response.body.imageName).toEqual(mockUser.imagePath);
    });
  });
});
