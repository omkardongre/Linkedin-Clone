import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { IonicModule, ModalController } from "@ionic/angular";
import { ModalComponent } from "./modal/modal.component";
import { Subscription } from "rxjs";
import { AuthService } from "src/app/auth/services/auth.service";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-start-post",
  templateUrl: "./start-post.component.html",
  styleUrls: ["./start-post.component.scss"],
  imports: [IonicModule, CommonModule],
  standalone: true,
})
export class StartPostComponent implements OnInit, OnDestroy {
  constructor(
    private modalController: ModalController,
    private authService: AuthService,
  ) {}

  userFullImagePath: string = "";
  private userImagePathSubscriptions!: Subscription;
  ngOnInit() {
    this.userImagePathSubscriptions =
      this.authService.userFullImagePath.subscribe((imagePath: string) => {
        this.userFullImagePath = imagePath;
      });
  }

  @Output() create: EventEmitter<any> = new EventEmitter<any>();

  async presentModal() {
    const modal = await this.modalController.create({
      component: ModalComponent,
      cssClass: "custom-modal-class",
    });

    await modal.present();

    // get data from modal on dismiss
    const { data, role } = await modal.onDidDismiss();

    if (!data) return;
    this.create.emit(data);
  }

  ngOnDestroy() {
    this.userImagePathSubscriptions.unsubscribe();
  }
}
