import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { FeedPostEntity } from '../models/post.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import { FeedPost } from '../models/post.interface';
import { Observable, from, throwError } from 'rxjs';
import { DeleteResult, UpdateResult } from 'typeorm';
import { User } from 'src/auth/models/user.interface';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(FeedPostEntity)
    private readonly feedPostRepository: Repository<FeedPostEntity>,
  ) {}

  findPosts(take: number, skip: number): Observable<FeedPost[]> {
    return from(
      this.feedPostRepository.find({
        take,
        skip,
        order: {
          createdAt: 'DESC',
        },
        relations: ['author'],
      }),
    ).pipe(
      catchError(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error fetching posts',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }

  createPost(user: User, feedPost: FeedPost): Observable<FeedPost> {
    feedPost.author = user;
    return from(this.feedPostRepository.save(feedPost)).pipe(
      catchError(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error creating post',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }

  findAllPosts(): Observable<FeedPost[]> {
    return from(this.feedPostRepository.find()).pipe(
      catchError(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error fetching all posts',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }

  updatePost(id: number, feedPost: FeedPost): Observable<UpdateResult> {
    return from(this.feedPostRepository.update(id, feedPost)).pipe(
      catchError(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error updating post',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }

  deletePost(id: number): Observable<DeleteResult> {
    return from(this.feedPostRepository.delete(id)).pipe(
      catchError(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error deleting post',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }

  findPostById(id: number): Observable<FeedPost> {
    return from(
      this.feedPostRepository.findOne({
        where: { id },
        relations: ['author'],
      }),
    ).pipe(
      map((post) => {
        if (!post) {
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              error: 'Post not found',
            },
            HttpStatus.NOT_FOUND,
          );
        }
        return post;
      }),
      catchError(() => {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error fetching post',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }
}
