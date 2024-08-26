import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonicModule, ModalController } from "@ionic/angular";
import { BehaviorSubject, Subscription, take } from "rxjs";
import { AuthService } from "src/app/auth/services/auth.service";

@Component({
  selector: "app-modal",
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.scss"],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
})
export class ModalComponent implements OnInit, OnDestroy {
  constructor(
    private modalController: ModalController,
    private authService: AuthService,
  ) {}

  fullName$ = new BehaviorSubject<string>("");
  fullName = "";
  postContent = "";
  userFullImagePath: string = "";
  private userImagePathSubscriptions!: Subscription;

  @Input() postId?: number;
  @Input() postBody?: string;

  ngOnInit() {
    this.postContent = this.postBody || "";
    this.userImagePathSubscriptions =
      this.authService.userFullImagePath.subscribe((imagePath: string) => {
        this.userFullImagePath = imagePath;
      });
    this.authService.userFullName.pipe(take(1)).subscribe((fullName) => {
      this.fullName = fullName;
      this.fullName$.next(fullName);
    });
  }

  dismissModal() {
    this.modalController.dismiss(null, "cancel");
  }

  onPost() {
    if (!this.postContent) {
      return;
    }
    this.modalController.dismiss(this.postContent, "post");
  }

  ngOnDestroy() {
    this.userImagePathSubscriptions.unsubscribe();
  }
}
