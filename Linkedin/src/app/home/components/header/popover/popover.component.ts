import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { IonicModule, NavController, PopoverController } from "@ionic/angular";
import { BehaviorSubject, Subscription, take } from "rxjs";
import { AuthService } from "src/app/auth/services/auth.service";

@Component({
  selector: "app-popover",
  templateUrl: "./popover.component.html",
  styleUrls: ["./popover.component.scss"],
  imports: [IonicModule, CommonModule],
  standalone: true,
})
export class PopoverComponent implements OnInit, OnDestroy {
  userFullImagePath: string = "";
  private userImagePathSubscriptions!: Subscription;
  fullName$ = new BehaviorSubject<string>("");
  fullName = "";

  constructor(
    private navCtrl: NavController,
    private popoverCtrl: PopoverController,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.userImagePathSubscriptions =
      this.authService.userFullImagePath.subscribe((imagePath: string) => {
        this.userFullImagePath = imagePath;
      });

    this.authService.userFullName.pipe(take(1)).subscribe((fullName) => {
      this.fullName = fullName;
      this.fullName$.next(fullName);
    });
  }

  onSignOut() {
    this.navCtrl.navigateRoot("/login").then(() => {
      this.popoverCtrl.dismiss();
      this.authService.logout();
    });
  }

  ngOnDestroy() {
    this.userImagePathSubscriptions.unsubscribe();
  }
}
