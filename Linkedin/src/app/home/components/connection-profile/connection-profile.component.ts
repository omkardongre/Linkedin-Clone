import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { map, Observable, Subscription, switchMap, take, tap } from "rxjs";
import { User } from "src/app/auth/models/user.model";
import { ConnectionProfileService } from "../../services/connection-profile.service";
import {
  FriendRequest,
  FriendRequest_Status,
  FriendRequestResponse,
  FriendRequestStatus,
} from "../models/FriendRequest";
import { AuthService } from "src/app/auth/services/auth.service";
import { IonicModule } from "@ionic/angular";
import { CommonModule } from "@angular/common";
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: "app-connection-profile",
  templateUrl: "./connection-profile.component.html",
  styleUrls: ["./connection-profile.component.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent],
})
export class ConnectionProfileComponent implements OnInit {
  userFullImagePath: string = "";
  friendRequest!: FriendRequest;
  friendRequestStatus: FriendRequest_Status = "NOT-SENT";
  friendUserId: number = -1;
  userId: number = -1;
  friendUser!: User;
  user!: User;

  constructor(
    private route: ActivatedRoute,
    private connectionProfileService: ConnectionProfileService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        map((params: Params) => {
          this.friendUserId = +params["id"];
        }),
      )
      .subscribe();

    this.authService.userId.pipe(take(1)).subscribe((userId: number) => {
      this.userId = userId;
    });

    this.connectionProfileService
      .getConnectionUser(this.friendUserId)
      .subscribe((user: User) => {
        this.friendUser = user;
        this.userFullImagePath = this.authService.getFullImagePath(
          user.imagePath,
        );
      });

    this.authService.userStream.pipe(take(1)).subscribe((user: User | null) => {
      this.user = user!;
      this.userFullImagePath = this.authService.getFullImagePath(
        user!.imagePath,
      );
    });

    this.connectionProfileService
      .getFriendRequest(this.friendUserId)
      .subscribe((friendRequest: FriendRequest) => {
        if (!friendRequest) {
          return;
        }

        this.friendRequest = friendRequest;
        this.friendRequestStatus = friendRequest.status!;
        if (friendRequest.creator?.id === this.userId) {
          this.friendUser = friendRequest.receiver!;
        } else {
          this.friendUser = friendRequest.creator!;
        }

        this.userFullImagePath = this.authService.getFullImagePath(
          this.friendUser?.imagePath,
        );
      });
  }

  addUser(): Subscription {
    return this.connectionProfileService
      .addConnectionUser(this.friendUserId)
      .subscribe(() => {
        this.friendRequestStatus = "PENDING";
      });
  }

  // getUser(): Observable<User> {
  //   return this.connectionProfileService.getConnectionUser(this.friendUserId);
  // }

  // getFriendRequestStatus(): Observable<FriendRequestStatus> {
  //   return this.connectionProfileService.getFriendRequestStatus(
  //     this.friendUserId,
  //   );
  // }

  handleFriendRequest(status: FriendRequestResponse) {
    this.friendRequestStatus = status;
    this.connectionProfileService
      .responseToFriendRequest(this.friendRequest.id!, status)
      .subscribe((friendRequest: FriendRequest) => {
        this.friendRequest.status = friendRequest.status;
      });
  }
}
