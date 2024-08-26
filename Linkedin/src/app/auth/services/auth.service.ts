import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { NewUser } from "../models/newUser.model";
import { environment } from "src/environments/environment.prod";
import { Role, User } from "../models/user.model";
import {
  BehaviorSubject,
  filter,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from "rxjs";
import { Storage } from "@capacitor/storage";
import { UserResponse } from "../models/userResponse.model";
import { jwtDecode } from "jwt-decode";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  // purpose : To guard routes
  private $user = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {}

  get isUserLoggedIn(): Observable<boolean> {
    return this.$user.asObservable().pipe(
      switchMap((user: User | null) => {
        return of(user !== null);
      }),
    );
  }

  get userStream(): Observable<User | null> {
    return this.$user.asObservable();
  }

  get userRole(): Observable<Role> {
    return this.$user.asObservable().pipe(
      filter((user: User | null): user is User => user !== null),
      switchMap((user: User) => {
        return of(user.role);
      }),
    );
  }

  get userId(): Observable<number> {
    return this.$user.asObservable().pipe(
      filter((user: User | null): user is User => user !== null),
      switchMap((user: User) => {
        return of(user.id);
      }),
    );
  }

  get userFullName(): Observable<string> {
    return this.$user.asObservable().pipe(
      filter((user: User | null): user is User => user !== null),
      switchMap((user: User) => {
        return of(`${user.firstName} ${user.lastName}`);
      }),
    );
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http
      .post<{
        token: string;
      }>(`${environment.baseApiUrl}/auth/login`, { email, password })
      .pipe(
        take(1),
        tap(async (response: { token: string }) => {
          await Storage.set({ key: "token", value: response.token });
          const decodedToken: UserResponse = jwtDecode(response.token);
          this.$user.next(decodedToken.user);
        }),
      );
  }

  register(user: NewUser): Observable<User> {
    return this.http
      .post<User>(`${environment.baseApiUrl}/auth/register`, user)
      .pipe(
        take(1),
        tap((user: User) => this.$user.next(user)),
      );
  }

  logout() {
    this.$user.next(null);
    Storage.remove({ key: "token" });
  }

  //Check on app start if token is in storage
  isTokenInStorage(): Observable<boolean> {
    return from(Storage.get({ key: "token" })).pipe(
      take(1),
      switchMap((data) => {
        if (!data.value) {
          return of(false);
        }
        const decodedToken: UserResponse = jwtDecode(data.value);
        const jwtExpirationInMsSinceUnixEpoch = decodedToken.exp * 1000;
        const timeLeftInMs = jwtExpirationInMsSinceUnixEpoch - Date.now();
        if (timeLeftInMs <= 0) {
          return of(false);
        }
        this.$user.next(decodedToken.user);
        return of(true);
      }),
    );
  }

  get userFullImagePath(): Observable<string> {
    return this.$user.asObservable().pipe(
      filter((user: User | null): user is User => user !== null),
      switchMap((user: User) => {
        let fullImagePath = this.getFullImagePath(user.imagePath);
        return of(fullImagePath);
      }),
    );
  }

  getFullImagePath(imageName?: string): string {
    if (!imageName) {
      return `${environment.baseApiUrl}/feed/image/blank-profile-picture.png`;
    }
    return `${environment.baseApiUrl}/feed/image/${imageName}`;
  }

  getUserImage() {
    return this.http.get(`${environment.baseApiUrl}/user/image`).pipe(take(1));
  }

  getUserImageName(): Observable<{ imageName: string }> {
    return this.http
      .get<{ imageName: string }>(`${environment.baseApiUrl}/user/image-name`)
      .pipe(take(1));
  }

  updateUserImagePath(imagePath: string): Observable<User> {
    return this.$user.pipe(
      take(1),
      map((user: User | null) => {
        if (!user) {
          throw new Error("User is not logged in");
        }

        user.imagePath = imagePath;
        this.$user.next(user);
        return user;
      }),
    );
  }

  uploadUserImage(
    formData: FormData,
  ): Observable<{ modifiedFileName: string }> {
    return this.http
      .post<{
        modifiedFileName: string;
      }>(`${environment.baseApiUrl}/user/upload`, formData)
      .pipe(take(1));
  }
}
