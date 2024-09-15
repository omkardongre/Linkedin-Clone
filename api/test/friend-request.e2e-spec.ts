import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/models/user.interface';
import { cleanupDatabase } from './utils/database-cleaner';
import { FriendRequest_Status } from '../src/auth/models/friend-request.interface';

describe('FriendRequestController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken1: string;
  let jwtToken2: string;
  let userId1: string;
  let userId2: string;

  const mockUser1: User = {
    firstName: 'mohit',
    lastName: 'dongre',
    email: 'mohit.dongre@example.com',
    password: 'password123',
  };

  const mockUser2: User = {
    firstName: 'shankar',
    lastName: 'naik',
    email: 'shankar.naik@example.com',
    password: 'password456',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    await cleanupDatabase(dataSource);

    // Register users and get JWT tokens
    const registerResponse1 = await request(app.getHttpServer())
      .post('/auth/register')
      .send(mockUser1)
      .expect(HttpStatus.CREATED);

    userId1 = registerResponse1.body.id;

    const loginResponse1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: mockUser1.email, password: mockUser1.password })
      .expect(HttpStatus.OK);

    jwtToken1 = loginResponse1.body.token;

    const registerResponse2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send(mockUser2)
      .expect(HttpStatus.CREATED);

    userId2 = registerResponse2.body.id;

    const loginResponse2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: mockUser2.email, password: mockUser2.password })
      .expect(HttpStatus.OK);

    jwtToken2 = loginResponse2.body.token;
  });

  afterAll(async () => {
    await cleanupDatabase(dataSource);
    await app.close();
  });

  describe('POST /user/friend-request/send/:receiverId', () => {
    it('should send a friend request', async () => {
      const response = await request(app.getHttpServer())
        .post(`/user/friend-request/send/${userId2}`)
        .set('Authorization', `Bearer ${jwtToken1}`)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.creator.id).toBe(userId1);
      expect(response.body.receiver.id).toBe(userId2);
    });

    it('should not allow sending a friend request to oneself', async () => {
      const response = await request(app.getHttpServer())
        .post(`/user/friend-request/send/${userId1}`)
        .set('Authorization', `Bearer ${jwtToken1}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBe('Cannot send request to self');
    });

    it('should not allow sending a duplicate friend request', async () => {
      const response = await request(app.getHttpServer())
        .post(`/user/friend-request/send/${userId2}`)
        .set('Authorization', `Bearer ${jwtToken1}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBe(
        'Friend request already sent or received',
      );
    });
  });

  describe('GET /user/friend-request/status/:receiverId', () => {
    it('should get the friend request status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/friend-request/status/${userId2}`)
        .set('Authorization', `Bearer ${jwtToken1}`)
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('PENDING');
    });

    it('should return WAITING-FOR-APPROVAL for the receiver', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/friend-request/status/${userId1}`)
        .set('Authorization', `Bearer ${jwtToken2}`)
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('WAITING-FOR-APPROVAL');
    });
  });

  describe('GET /user/friend-request/between/:userId', () => {
    it('should get a friend request between users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/friend-request/between/${userId2}`)
        .set('Authorization', `Bearer ${jwtToken1}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.creator.id).toBe(userId1);
      expect(response.body.receiver.id).toBe(userId2);
    });

    it('should return NOT_FOUND for non-existent friend request', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/friend-request/between/9999`)
        .set('Authorization', `Bearer ${jwtToken1}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBe('Friend request not found');
    });
  });

  describe('PUT /user/friend-request/response/:friendRequestId', () => {
    let friendRequestId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/friend-request/between/${userId2}`)
        .set('Authorization', `Bearer ${jwtToken1}`)
        .expect(HttpStatus.OK);

      friendRequestId = response.body.id;
    });

    it('should respond to a friend request', async () => {
      const response = await request(app.getHttpServer())
        .put(`/user/friend-request/response/${friendRequestId}`)
        .set('Authorization', `Bearer ${jwtToken2}`)
        .send({ status: 'ACCEPTED' as FriendRequest_Status })
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('ACCEPTED');
    });

    it('should return NOT_FOUND for non-existent friend request', async () => {
      const response = await request(app.getHttpServer())
        .put(`/user/friend-request/response/9999`)
        .set('Authorization', `Bearer ${jwtToken2}`)
        .send({ status: 'ACCEPTED' as FriendRequest_Status })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toBe('Friend request not found');
    });
  });

  describe('GET /user/friend-request/me/received-requests', () => {
    it('should get received friend requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/friend-request/me/received-requests')
        .set('Authorization', `Bearer ${jwtToken2}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].creator.id).toBe(userId1);
    });
  });
});
