import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, take } from "rxjs";
import { User } from "src/app/auth/models/user.model";
import { environment } from "src/environments/environment.prod";
import {
  FriendRequest,
  FriendRequestResponse,
  FriendRequestStatus,
} from "../components/models/FriendRequest";

@Injectable({
  providedIn: "root",
})
export class ConnectionProfileService {
  constructor(private http: HttpClient) {}

  friendRequests: FriendRequest[] = [];

  getConnectionUser(id: number): Observable<User> {
    return this.http.get<User>(`${environment.baseApiUrl}/user/${id}`);
  }

  getFriendRequestStatus(id: number): Observable<FriendRequestStatus> {
    return this.http.get<FriendRequestStatus>(
      `${environment.baseApiUrl}/user/friend-request/status/${id}`,
    );
  }

  addConnectionUser(id: number): Observable<FriendRequest | { error: string }> {
    return this.http.post<FriendRequest | { error: string }>(
      `${environment.baseApiUrl}/user/friend-request/send/${id}`,
      {},
    );
  }

  getFriendRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(
      `${environment.baseApiUrl}/user/friend-request/me/received-requests`,
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
      .pipe(take(1));
  }

  getFriendRequest(
    senderId: number,
    receiverId: number,
  ): Observable<FriendRequest> {
    return this.http
      .get<FriendRequest>(
        `${environment.baseApiUrl}/user/friend-request/${senderId}/${receiverId}`,
      )
      .pipe(take(1));
  }
}
