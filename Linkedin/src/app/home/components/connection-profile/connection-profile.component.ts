import { Component, OnDestroy, OnInit } from "@angular/core";
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
export class ConnectionProfileComponent implements OnInit, OnDestroy {
  userFullImagePath!: string;
  friendRequest: FriendRequest | undefined;
  friendUserId!: number;
  userId!: number;
  friendUser: User | undefined;

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

    // this.authService.userStream.pipe(take(1)).subscribe((user: User | null) => {
    //   this.user = user!;
    //   this.userFullImagePath = this.authService.getFullImagePath(
    //     user!.imagePath,
    //   );
    // });

    this.connectionProfileService
      .getFriendRequest(this.friendUserId)
      .subscribe((friendRequest: FriendRequest) => {
        this.friendRequest = friendRequest;
        if (friendRequest.creator?.id === this.userId) {
          this.friendUser = friendRequest.receiver;
        } else {
          this.friendUser = friendRequest.creator;
        }

        this.userFullImagePath = this.authService.getFullImagePath(
          this.friendUser?.imagePath,
        );
      });
  }

  addUser(): Subscription {
    this.friendRequest!.status = "PENDING";
    return this.connectionProfileService
      .addConnectionUser(this.friendUserId)

      .subscribe(() => {
        this.friendRequest!.status = "PENDING";
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
    this.connectionProfileService
      .responseToFriendRequest(this.friendRequest!.id!, status)
      .subscribe((friendRequest: FriendRequest) => {
        this.friendRequest!.status = friendRequest.status;
      });
  }

  ngOnDestroy(): void {}
}
