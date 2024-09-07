import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { FeedService } from '../services/feed.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserService } from '../../auth/services/user.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { IsCreatorGuard } from '../guards/is-creator.guard';
import * as httpMocks from 'node-mocks-http';
import { User } from '../../auth/models/user.interface';
import { FeedPost } from '../models/post.interface';
import { DeleteResult, UpdateResult } from 'typeorm';
import { of } from 'rxjs';

describe('FeedController', () => {
  let feedController: FeedController;
  let feedService: FeedService;
  let userService: UserService;

  const mockRequest = httpMocks.createRequest();
  mockRequest.user = {
    id: 1,
  };

  const mockFeedPost = {
    id: 1,
    body: 'This is a test post',
    createdAt: new Date(),
  };

  const images = ['test.jpg', 'test.png', 'test.gif'];

  const mockFeedPosts: FeedPost[] = [
    mockFeedPost,
    { ...mockFeedPost, id: 2, body: 'This is second test post' },
    { ...mockFeedPost, id: 3, body: 'This is a third test post' },
    { ...mockFeedPost, id: 4, body: 'This is a fourth test post' },
    { ...mockFeedPost, id: 5, body: 'This is a fifth test post' },
    { ...mockFeedPost, id: 6, body: 'This is a sixth test post' },
  ];

  const mockDeleteResult: DeleteResult = {
    raw: [],
    affected: 1,
  };

  const mockUpdateResult: UpdateResult = {
    ...mockDeleteResult,
    generatedMaps: [],
  };

  const feedMockService = {
    createPost: jest
      .fn()
      .mockImplementation((user: User, feedPost: FeedPost) => of(feedPost)),
    findPosts: jest
      .fn()
      .mockImplementation((take: number, skip: number) =>
        of(mockFeedPosts.slice(skip, skip + take)),
      ),
    deletePost: jest.fn().mockImplementation(() => of(mockDeleteResult)),
    updatePost: jest.fn().mockImplementation(() => of(mockUpdateResult)),
    fileExists: jest.fn().mockImplementation((filename: string) => {
      if (images.includes(filename)) {
        return true;
      }
      return false;
    }),
  };

  const authMockService = {}; // Mock AuthService
  const userMockService = {}; // Mock UserService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        FeedService,
        {
          provide: AuthService,
          useValue: authMockService,
        },
        {
          provide: UserService,
          useValue: userMockService,
        },
        {
          provide: JwtGuard,
          useValue: jest.fn().mockImplementation(() => true),
        },
        {
          provide: IsCreatorGuard,
          useValue: jest.fn().mockImplementation(() => true),
        },
      ],
    })
      .overrideProvider(FeedService)
      .useValue(feedMockService)
      .compile();
    feedService = moduleRef.get<FeedService>(FeedService);
    feedController = moduleRef.get<FeedController>(FeedController);
    userService = moduleRef.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(feedController).toBeDefined();
  });

  it('should create a post', (done) => {
    feedController.create(mockFeedPost, mockRequest).subscribe((result) => {
      expect(result).toEqual(mockFeedPost);
      done();
    });
  });

  it('should get 3 feedPosts skipping first two', (done) => {
    feedController.findPosts(3, 2).subscribe((result) => {
      expect(result).toEqual(mockFeedPosts.slice(2, 2 + 3));
      done();
    });
  });

  it('should delete a post', (done) => {
    feedController.delete(1).subscribe((result) => {
      expect(result).toEqual(mockDeleteResult);
      done();
    });
  });

  it('should update a post', (done) => {
    feedController.update(1, mockFeedPost).subscribe((result) => {
      expect(result).toEqual(mockUpdateResult);
      done();
    });
  });

  it('should find an image', () => {
    const mockResponse = httpMocks.createResponse();
    mockResponse.sendFile = jest.fn();
    const filename = 'test.jpg';
    feedController.findImage(filename, mockResponse);
    expect(mockResponse.statusCode).toBe(200);
    expect(mockResponse.sendFile).toHaveBeenCalledWith(filename, {
      root: 'images',
    });
  });

  it('should return 404 if image not found', () => {
    const mockResponse = httpMocks.createResponse();
    const filename = 'notfound.jpg';
    feedController.findImage(filename, mockResponse);
    expect(mockResponse.statusCode).toBe(404);
  });
});
