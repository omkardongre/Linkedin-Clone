import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/models/user.interface';
import { cleanupDatabase } from './utils/database-cleaner';
import { FeedPost } from '../src/feed/models/post.interface';

describe('FeedController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let userId: string;
  let postId: number;

  const mockUser: User = {
    firstName: 'prasad',
    lastName: 'sawant',
    email: `prasad.sawant@example.com`,
    password: 'password123',
  };

  let mockPost: FeedPost = {
    body: 'This is a test post',
    createdAt: new Date(),
    author: null,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    await cleanupDatabase(dataSource);

    // Register user and get JWT token
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
    // await cleanupDatabase(dataSource);
    await app.close();
  });

  describe('POST /feed', () => {
    it('should create a new post', async () => {
      const response = await request(app.getHttpServer())
        .post('/feed')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(mockPost)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.body).toBe(mockPost.body);
      expect(response.body.author.id).toBe(userId);

      mockPost = response.body;
      postId = response.body.id;
    });

    it('should not create a post without authentication', async () => {
      await request(app.getHttpServer())
        .post('/feed')
        .send(mockPost)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /feed', () => {
    it('should get posts with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/feed')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(1);
    });

    it('should get posts with custom pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/feed?take=5&skip=0')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should limit take to 20', async () => {
      const response = await request(app.getHttpServer())
        .get('/feed?take=30&skip=0')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(20);
    });
  });

  describe('PUT /feed/:id', () => {
    it('should update a post', async () => {
      const updatedPost = { ...mockPost, body: 'Updated test post' };
      const response = await request(app.getHttpServer())
        .put(`/feed/${postId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updatedPost)
        .expect(HttpStatus.OK);

      expect(response.body.affected).toBe(1);
    });

    it('should not update a non-existent post', async () => {
      await request(app.getHttpServer())
        .put('/feed/9999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ ...mockPost, body: 'Non-existent post update' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /feed/image/:filename', () => {
    it('should return an image file', async () => {
      const response = await request(app.getHttpServer())
        .get(`/feed/image/blank-profile-picture.png`)
        .expect(HttpStatus.OK)
        .expect('Content-Type', /image/);

      expect(response.body).toBeTruthy();
    });

    it('should return 404 for non-existent image', async () => {
      await request(app.getHttpServer())
        .get('/feed/image/non-existent.jpg')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /feed/:id', () => {
    it('should delete a post', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/feed/${postId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe('Post deleted successfully');
    });

    it('should not delete a non-existent post', async () => {
      await request(app.getHttpServer())
        .delete('/feed/9999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
