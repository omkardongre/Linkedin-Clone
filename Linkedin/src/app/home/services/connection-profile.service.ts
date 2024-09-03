import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, Observable, of, take, tap } from "rxjs";
import { User } from "src/app/auth/models/user.model";
import { environment } from "src/environments/environment.prod";
import {
  FriendRequest,
  FriendRequestResponse,
  FriendRequestStatus,
} from "../components/models/FriendRequest";
import { ErrorHandlerService } from "src/app/core/error.handler.service";

@Injectable({
  providedIn: "root",
})
export class ConnectionProfileService {
  constructor(
    private http: HttpClient,
    private errorHandlerService: ErrorHandlerService,
  ) {}

  friendRequests: FriendRequest[] = [];

  // getConnectionUser(id: number): Observable<User> {
  //   return this.http.get<User>(`${environment.baseApiUrl}/user/${id}`);
  // }

  // getFriendRequestStatus(id: number): Observable<FriendRequestStatus> {
  //   return this.http.get<FriendRequestStatus>(
  //     `${environment.baseApiUrl}/user/friend-request/status/${id}`,
  //   );
  // }

  addConnectionUser(id: number): Observable<FriendRequest> {
    return this.http
      .post<FriendRequest>(
        `${environment.baseApiUrl}/user/friend-request/send/${id}`,
        {},
      )
      .pipe(
        catchError(
          this.errorHandlerService.handleError<FriendRequest>(
            "addConnectionUser",
          ),
        ),
      );
  }
  getFriendRequests(): Observable<FriendRequest[]> {
    return this.http
      .get<
        FriendRequest[]
      >(`${environment.baseApiUrl}/user/friend-request/me/received-requests`)
      .pipe(
        catchError(
          this.errorHandlerService.handleError<FriendRequest[]>(
            "getFriendRequests",
          ),
        ),
      );
  }

  responseToFriendRequest(
    id: number,
    status: FriendRequestResponse,
  ): Observable<FriendRequestStatus> {
    return this.http
      .put<FriendRequestStatus>(
        `${environment.baseApiUrl}/user/friend-request/response/${id}`,
        { status },
      )
      .pipe(
        take(1),
        catchError(
          this.errorHandlerService.handleError<FriendRequestStatus>(
            "responseToFriendRequest",
          ),
        ),
      );
  }

  getFriendRequest(
    senderId: number,
    receiverId: number,
  ): Observable<FriendRequest> {
    return this.http
      .get<FriendRequest>(
        `${environment.baseApiUrl}/user/friend-request/${senderId}/${receiverId}`,
      )
      .pipe(
        take(1),
        catchError(
          this.errorHandlerService.handleError<FriendRequest>(
            "getFriendRequest",
          ),
        ),
      );
  }
}
