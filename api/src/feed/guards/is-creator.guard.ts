import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { map, Observable, of, switchMap } from 'rxjs';
import { AuthService } from 'src/auth/services/auth.service';
import { FeedService } from '../services/feed.service';
import { handleError } from 'src/core/error.utils';
import { FeedPost } from '../models/post.interface';

@Injectable()
export class IsCreatorGuard implements CanActivate {
  constructor(
    private readonly feedService: FeedService,
    private readonly authService: AuthService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const postId = request.params.id;
    if (!user || !postId) return false;
    if (user.role === 'admin') return true; // Admin can do anything

    return this.feedService.findPostById(+postId).pipe(
      switchMap((feedPost: FeedPost) => {
        if (feedPost.author.id !== user.id) {
          return handleError(
            HttpStatus.NOT_FOUND,
            'You are not the creator of this post',
          );
        }
        return of(true);
      }),
    );
  }
}
