import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { User } from 'src/auth/models/user.interface';
import { DeleteResult, UpdateResult } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { FeedPostEntity } from '../models/post.entity';
import { FeedPost } from '../models/post.interface';
import { handleError } from 'src/core/error.utils';
import * as fs from 'fs';
import * as path from 'path';
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
      switchMap((feedPosts: FeedPost[]) => {
        if (!feedPosts.length) {
          return handleError(HttpStatus.NOT_FOUND, 'No records found');
        }
        return of(feedPosts);
      }),
    );
  }

  createPost(user: User, feedPost: FeedPost): Observable<FeedPost> {
    feedPost.author = user;
    return from(this.feedPostRepository.save(feedPost)).pipe(
      catchError(() => {
        return handleError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Error creating post',
        );
      }),
    );
  }

  findAllPosts(): Observable<FeedPost[]> {
    return from(this.feedPostRepository.find()).pipe(
      switchMap((feedPosts: FeedPost[]) => {
        if (!feedPosts.length) {
          return handleError(HttpStatus.NOT_FOUND, 'No records found');
        }
        return of(feedPosts);
      }),
    );
  }

  updatePost(id: number, feedPost: FeedPost): Observable<UpdateResult> {
    return from(this.feedPostRepository.update(id, feedPost)).pipe(
      switchMap((updateResult: UpdateResult) => {
        if (updateResult.affected === 0) {
          return handleError(HttpStatus.NOT_FOUND, 'Post not found');
        }
        return of(updateResult);
      }),
    );
  }

  deletePost(id: number): Observable<DeleteResult> {
    return from(this.feedPostRepository.delete(id)).pipe(
      switchMap((deleteResult: DeleteResult) => {
        if (deleteResult.affected === 0) {
          return handleError(HttpStatus.NOT_FOUND, 'Post not found');
        }
        return of(deleteResult);
      }),
      catchError(() => {
        return handleError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Error deleting post',
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
      switchMap((feedPost: FeedPost) => {
        if (!feedPost) {
          return handleError(HttpStatus.NOT_FOUND, 'Post not found');
        }
        return of(feedPost);
      }),
    );
  }

  fileExists(filename: string): boolean {
    const filePath = path.join(__dirname, '../../../images', filename);
    return fs.existsSync(filePath);
  }
}
