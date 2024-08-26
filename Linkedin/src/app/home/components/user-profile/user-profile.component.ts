import { Component, OnInit } from "@angular/core";
import {
  IonicModule,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/angular";
import { AdvertisingComponent } from "../advertising/advertising.component";
import { AllPostsComponent } from "../all-posts/all-posts.component";
import { HeaderComponent } from "../header/header.component";
import { ProfileSummaryComponent } from "../profile-summary/profile-summary.component";
import { StartPostComponent } from "../start-post/start-post.component";

@Component({
  selector: "app-user-profile",
  templateUrl: "./user-profile.component.html",
  styleUrls: ["./user-profile.component.scss"],
  standalone: true,
  imports: [
    IonicModule,
    HeaderComponent,
    ProfileSummaryComponent,
    StartPostComponent,
    AdvertisingComponent,
    AllPostsComponent,
  ],
})
export class UserProfileComponent {
  body: string = "";

  onCreatePost(body: string) {
    this.body = body;
  }

  constructor() {}
}
