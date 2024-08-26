import { Component, OnDestroy, OnInit } from "@angular/core";
import { IonicModule, Platform, PopoverController } from "@ionic/angular";
import { PopoverComponent } from "./popover/popover.component";
import { Subscription } from "rxjs";
import { AuthService } from "src/app/auth/services/auth.service";
import { CommonModule } from "@angular/common";
import { FriendRequestsPopoverComponent } from "./friend-requests-popover/friend-requests-popover.component";
import { FriendRequest } from "../models/FriendRequest";
import { ConnectionProfileService } from "../../services/connection-profile.service";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [IonicModule, CommonModule, RouterLink],
  standalone: true,
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMobile: boolean = false;
  userFullImagePath: string = "";
  private userImagePathSubscriptions!: Subscription;

  private friendRequestSubscriptions!: Subscription;

  ngOnInit() {
    this.checkScreenSize();
    this.platform.resize.subscribe(() => {
      this.checkScreenSize();
    });

    this.userImagePathSubscriptions =
      this.authService.userFullImagePath.subscribe((imagePath: string) => {
        this.userFullImagePath = imagePath;
      });

    this.friendRequestSubscriptions = this.connectionProfileService
      .getFriendRequests()
      .subscribe((friendRequests: FriendRequest[]) => {
        this.connectionProfileService.friendRequests = friendRequests.filter(
          (friendRequest: FriendRequest) => friendRequest.status === "PENDING",
        );
      });
  }

  checkScreenSize() {
    this.isMobile = this.platform.width() < 768;
  }

  constructor(
    public popoverController: PopoverController,
    private platform: Platform,
    private authService: AuthService,
    public connectionProfileService: ConnectionProfileService,
  ) {}

  async presentPopover(ev: Event) {
    const popover = await this.popoverController.create({
      component: PopoverComponent, // Optional: Reference to a dedicated popover component
      event: ev,
      cssClass: "popover-class", // Optional: Custom CSS class
    });
    await popover.present();
  }

  async presentFriendRequestPopover(ev: Event) {
    const popover = await this.popoverController.create({
      component: FriendRequestsPopoverComponent, // Optional: Reference to a dedicated popover component
      event: ev,
      cssClass: "popover-class", // Optional: Custom CSS class
    });
    await popover.present();
  }

  async dismissPopover() {
    await this.popoverController.dismiss();
  }

  ngOnDestroy() {
    this.userImagePathSubscriptions.unsubscribe();
    this.friendRequestSubscriptions.unsubscribe();
  }
}
