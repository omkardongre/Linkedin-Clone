import {
  Component,
  inject,
  Input,
  OnInit,
  SimpleChange,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  InfiniteScrollCustomEvent,
  IonicModule,
  IonInfiniteScroll,
  ModalController,
} from "@ionic/angular";
import { IonInfiniteScrollCustomEvent } from "@ionic/core";
import { CommonModule } from "@angular/common";
import { PostService } from "../../services/post.service";
import { Post, QueryParams } from "../models/Post";
import { BehaviorSubject, Subscription } from "rxjs";
import { AuthService } from "src/app/auth/services/auth.service";
import { ModalComponent } from "../start-post/modal/modal.component";
import { RouterModule } from "@angular/router";

// interface Post {
//   id: number;
//   author: {
//     name: string;
//     headline: string;
//     avatar: string;
//   };
//   body: string;
//   createdAt: string;
//   visibility: string;
// }

@Component({
  selector: "app-all-posts",
  templateUrl: "./all-posts.component.html",
  styleUrls: ["./all-posts.component.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
})
export class AllPostsComponent implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  private postService = inject(PostService);
  private modalController = inject(ModalController);
  private authService = inject(AuthService);
  userFullImagePath: string = "";
  private userImagePathSubscriptions!: Subscription;
  @Input() postBody?: string;

  posts: Post[] = [];
  numberOfPosts = 2;
  skipPosts = 0;

  queryParams: string = "";

  userId: number | undefined;

  constructor() {}

  ngOnInit() {
    this.getPosts(undefined);
    this.authService.userId.subscribe((id) => {
      this.userId = id;
    });

    this.userImagePathSubscriptions =
      this.authService.userFullImagePath.subscribe((imagePath: string) => {
        this.posts.forEach((post) => {
          if (post.author.id === this.userId) {
            post.fullImagePath = imagePath;
          }
        });
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const post = changes["postBody"].currentValue;
    if (!post) return;

    this.postService.createPost(post).subscribe((post: Post) => {
      this.authService
        .getUserImageName()
        .subscribe((response: { imageName: string }) => {
          const doesAuthHasImage = !!response.imageName;
          let fullImagePath = this.authService.getFullImagePath(
            response.imageName,
          );
          post.fullImagePath = fullImagePath;
        });
      this.posts.unshift(post);
    });
  }

  getPosts(event: IonInfiniteScrollCustomEvent<any> | undefined) {
    if (this.skipPosts > 4) {
      this.infiniteScroll.disabled = true;
    }
    this.queryParams = `?take=${this.numberOfPosts}&skip=${this.skipPosts}`;
    this.postService
      .getSelectedPosts(this.queryParams)
      .subscribe((posts: Post[]) => {
        this.posts.push(...posts);

        for (let i = 0; i < this.posts.length; i++) {
          const fullImagePath = this.authService.getFullImagePath(
            this.posts[i].author.imagePath,
          );
          this.posts[i].fullImagePath = fullImagePath;
        }

        if (event) {
          event.target.complete();
        }
        this.skipPosts = this.skipPosts + 2;
      });
  }

  loadPosts(event: IonInfiniteScrollCustomEvent<any> | undefined) {
    this.getPosts(event);
  }

  deletePost(id: number) {
    this.postService.deletePost(id).subscribe(() => {
      this.posts = this.posts.filter((post) => post.id !== id);
    });
  }

  async presentUpdateModal(id: number) {
    const modal = await this.modalController.create({
      component: ModalComponent,
      cssClass: "custom-modal-class",
      componentProps: {
        postId: id,
        postBody: this.posts.find((post) => post.id === id)?.body,
      },
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    const updatedPostBody = data;

    if (!data) return;

    const postIndex = this.posts.findIndex((post) => post.id === id);
    this.posts[postIndex].body = updatedPostBody;
  }
}
