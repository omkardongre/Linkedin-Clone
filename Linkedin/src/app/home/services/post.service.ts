import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Post, QueryParams } from "../components/models/Post";
import { map, Observable, take, tap } from "rxjs";
import { environment } from "src/environments/environment.prod";
import { AuthService } from "src/app/auth/services/auth.service";

@Injectable({
  providedIn: "root",
})
export class PostService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.authService
      .getUserImageName()
      .pipe(
        map((response: { imageName: string }) => response.imageName),
        tap((imageName: string) => {
          const defaultImageName = "blank-profile-picture.png";
          this.authService
            .updateUserImagePath(imageName || defaultImageName)
            .subscribe();
        }),
      )
      .subscribe();
  }

  getSelectedPosts(queryParams: string): Observable<Post[]> {
    return this.http.get<Post[]>(
      `${environment.baseApiUrl}/feed${queryParams}`,
    );
  }

  createPost(body: string): Observable<Post> {
    return this.http
      .post<Post>(`${environment.baseApiUrl}/feed`, { body })
      .pipe(take(1));
  }

  updatePost(postId: number, body: string): Observable<Post> {
    return this.http
      .put<Post>(`${environment.baseApiUrl}/feed/${postId}`, {
        body,
      })
      .pipe(take(1));
  }

  deletePost(postId: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.baseApiUrl}/feed/${postId}`)
      .pipe(take(1));
  }
}
