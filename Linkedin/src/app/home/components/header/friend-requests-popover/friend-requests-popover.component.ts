import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { IonicModule, PopoverController } from "@ionic/angular";
import {
  FriendRequest,
  FriendRequestResponse,
} from "../../models/FriendRequest";
import { PopoverComponent } from "../popover/popover.component";
import { ConnectionProfileService } from "src/app/home/services/connection-profile.service";
import { FriendRequestSender } from "src/app/auth/models/user.model";
import { AuthService } from "src/app/auth/services/auth.service";

@Component({
  selector: "app-friend-requests-popover",
  templateUrl: "./friend-requests-popover.component.html",
  styleUrls: ["./friend-requests-popover.component.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class FriendRequestsPopoverComponent implements OnInit {
  constructor(
    private popoverController: PopoverController,
    private connectionProfileService: ConnectionProfileService,
    public authService: AuthService,
  ) {}

  friendRequestSender: FriendRequestSender[] = [];

  ngOnInit() {
    this.connectionProfileService.friendRequests.map(
      (friendRequest: FriendRequest) => {
        this.friendRequestSender.push({
          id: friendRequest.id!,
          firstName: friendRequest.creator!.firstName,
          lastName: friendRequest.creator!.lastName,
          fullImagePath: this.authService.getFullImagePath(
            friendRequest.creator!.imagePath,
          ),
        });
      },
    );
  }

  handleFriendRequest(id: number, statusResponse: FriendRequestResponse) {
    this.connectionProfileService
      .responseToFriendRequest(id, statusResponse)
      .subscribe({
        next: (response) => {
          this.connectionProfileService.friendRequests =
            this.connectionProfileService.friendRequests.filter(
              (request) => request.id !== id,
            );
          this.popoverController.dismiss();
        },
        error: (error) => {
          console.error(error); // Handle the error appropriately
        },
      });
  }
}
