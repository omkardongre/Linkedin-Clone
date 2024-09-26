import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../services/feed.service';
import * as httpMocks from 'node-mocks-http';
import { FeedPost } from '../models/post.interface';
import { DeleteResult, UpdateResult } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedPostEntity } from '../models/post.entity';
import { User } from 'src/auth/models/user.interface';

describe('FeedService', () => {
  let feedService: FeedService;

  const mockRequest = httpMocks.createRequest();
  mockRequest.user = { id: 1 };

  const mockFeedPost: FeedPost = {
    id: 1,
    body: 'This is a test post',
    createdAt: new Date(),
    author: { id: 1 } as User,
  };

  const mockFeedPosts: FeedPost[] = [
    mockFeedPost,
    { ...mockFeedPost, id: 2, body: 'This is second test post' },
  ];

  const mockDeleteResult: DeleteResult = { raw: [], affected: 1 };
  const mockUpdateResult: UpdateResult = {
    ...mockDeleteResult,
    generatedMaps: [],
  };
  const mockFeedPostRepository = {
    find: jest.fn().mockResolvedValue(mockFeedPosts),
    save: jest.fn().mockResolvedValue(mockFeedPost),
    update: jest.fn().mockResolvedValue(mockUpdateResult),
    delete: jest.fn().mockImplementation((id: number) => {
      const post = mockFeedPosts.find((post) => post.id === id);
      if (!post) {
        return Promise.reject(new Error('Error deleting post'));
      }
      return Promise.resolve(mockDeleteResult);
    }),
    findOne: jest.fn().mockImplementation((query) => {
      const id = query.where.id;
      const post = mockFeedPosts.find((post) => post.id === id);
      if (!post) {
        return Promise.reject(new Error('Post not found'));
      }
      return Promise.resolve(post);
    }),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getRepositoryToken(FeedPostEntity),
          useValue: mockFeedPostRepository,
        },
      ],
    }).compile();

    feedService = moduleRef.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(feedService).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a post', (done) => {
      feedService
        .createPost(mockRequest.user, mockFeedPost)
        .subscribe((data: FeedPost) => {
          expect(data).toEqual(mockFeedPost);
          done();
        });
    });

    it('should handle error when creating a post', (done) => {
      jest
        .spyOn(mockFeedPostRepository, 'save')
        .mockRejectedValueOnce(new Error('Error creating post'));
      feedService.createPost(mockRequest.user, mockFeedPost).subscribe({
        error: (err) => {
          expect(err.message).toEqual('Error creating post');
          done();
        },
      });
    });
  });

  describe('findPosts', () => {
    it('should find posts', (done) => {
      feedService.findPosts(2, 2).subscribe((data: FeedPost[]) => {
        expect(data).toEqual(mockFeedPosts);
        done();
      });
    });

    it('should handle error when finding posts', (done) => {
      jest
        .spyOn(mockFeedPostRepository, 'find')
        .mockRejectedValueOnce(new Error('Error finding posts'));
      feedService.findPosts(2, 2).subscribe({
        error: (err) => {
          expect(err.message).toEqual('Error finding posts');
          done();
        },
      });
    });
  });

  describe('findAllPosts', () => {
    it('should find all posts', (done) => {
      feedService.findAllPosts().subscribe((data: FeedPost[]) => {
        expect(data).toEqual(mockFeedPosts);
        done();
      });
    });

    it('should handle error when finding all posts', (done) => {
      jest
        .spyOn(mockFeedPostRepository, 'find')
        .mockRejectedValueOnce(new Error('Error finding all posts'));
      feedService.findAllPosts().subscribe({
        error: (err) => {
          expect(err.message).toEqual('Error finding all posts');
          done();
        },
      });
    });
  });

  describe('updatePost', () => {
    it('should update a post', (done) => {
      feedService
        .updatePost(1, mockFeedPost)
        .subscribe((data: UpdateResult) => {
          expect(data).toEqual(mockUpdateResult);
          done();
        });
    });

    it('should handle error when updating a post', (done) => {
      jest
        .spyOn(mockFeedPostRepository, 'update')
        .mockRejectedValueOnce(new Error('Error updating post'));
      feedService.updatePost(1, mockFeedPost).subscribe({
        error: (err) => {
          expect(err.message).toEqual('Error updating post');
          done();
        },
      });
    });
  });

  describe('deletePost', () => {
    it('should delete a post', (done) => {
      feedService.deletePost(1).subscribe((response: { message: string }) => {
        expect(response.message).toEqual('Post deleted successfully');
        done();
      });
    });

    it('should handle error when deleting a non-existent post', (done) => {
      feedService.deletePost(10).subscribe({
        error: (err) => {
          expect(err.message).toEqual('Error deleting post');
          done();
        },
      });
    });
  });

  describe('findPostById', () => {
    it('should find a post by id', (done) => {
      feedService.findPostById(2).subscribe((data: FeedPost) => {
        expect(data).toEqual(mockFeedPosts.find((post) => post.id === 2));
        done();
      });
    });

    it('should handle error when finding a non-existent post by id', (done) => {
      feedService.findPostById(10).subscribe({
        error: (err) => {
          expect(err.message).toEqual('Post not found');
          done();
        },
      });
    });
  });
});
