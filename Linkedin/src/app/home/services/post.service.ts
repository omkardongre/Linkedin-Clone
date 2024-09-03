import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Post, QueryParams } from "../components/models/Post";
import { catchError, map, Observable, take, tap } from "rxjs";
import { environment } from "src/environments/environment.prod";
import { AuthService } from "src/app/auth/services/auth.service";
import { ErrorHandlerService } from "src/app/core/error.handler.service";

@Injectable({
  providedIn: "root",
})
export class PostService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private errorHandlerService: ErrorHandlerService,
  ) {
    this.authService
      .getUserImageName()
      .pipe(
        map((response: { imageName: string }) => response.imageName),
        tap((imageName: string) => {
          const defaultImageName = "blank-profile-picture.png";
          this.authService
            .updateUserImagePath(imageName || defaultImageName)
            .pipe(
              catchError(
                this.errorHandlerService.handleError<void>(
                  "updateUserImagePath",
                ),
              ),
            )
            .subscribe();
        }),
        catchError(
          this.errorHandlerService.handleError<string>("getUserImageName"),
        ),
      )
      .subscribe();
  }

  getSelectedPosts(queryParams: string): Observable<Post[]> {
    return this.http
      .get<Post[]>(`${environment.baseApiUrl}/feed${queryParams}`)
      .pipe(
        tap((posts: Post[]) => {
          if (posts.length === 0) {
            throw new Error("No posts found");
          }
        }),
        catchError(
          this.errorHandlerService.handleError<Post[]>("getSelectedPosts", []),
        ),
      );
  }

  createPost(body: string): Observable<Post> {
    return this.http
      .post<Post>(`${environment.baseApiUrl}/feed`, { body })
      .pipe(
        take(1),
        tap((post: Post) => {
          if (!post) {
            throw new Error("Failed to create post");
          }
        }),
        catchError(this.errorHandlerService.handleError<Post>("createPost")),
      );
  }

  updatePost(postId: number, body: string): Observable<Post> {
    return this.http
      .put<Post>(`${environment.baseApiUrl}/feed/${postId}`, {
        body,
      })
      .pipe(
        take(1),
        tap((post: Post) => {
          if (!post) {
            throw new Error("Failed to update post");
          }
        }),
        catchError(this.errorHandlerService.handleError<Post>("updatePost")),
      );
  }

  deletePost(postId: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.baseApiUrl}/feed/${postId}`)
      .pipe(
        take(1),
        tap((response) => {
          if (response !== undefined) {
            throw new Error("Failed to delete post");
          }
        }),
        catchError(this.errorHandlerService.handleError<void>("deletePost")),
      );
  }
}
