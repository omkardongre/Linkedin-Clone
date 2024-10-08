import { CommonModule } from "@angular/common";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { ChatService } from "../../services/chat.service";
import { Observable, Subscription, take } from "rxjs";
import { AuthService } from "src/app/auth/services/auth.service";
import { User } from "src/app/auth/models/user.model";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
  imports: [IonicModule, CommonModule, FormsModule],
  standalone: true,
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild("form") form!: NgForm;

  user!: User;
  private $userSubscription!: Subscription;
  userFullImagePath!: string;

  newMessage$!: Observable<string>;
  messages: string[] = [];

  friends: User[] = [];

  constructor(
    private chatService: ChatService,
    public authService: AuthService,
  ) { }

  ngOnInit() {
    // TODO: refactor - unsubscribe

    this.$userSubscription = this.authService.userStream
      .pipe(take(1))
      .subscribe((user: User | null) => {
        this.user = user!;
        this.userFullImagePath = this.authService.getFullImagePath(
          user!.imagePath,
        );
      });

    this.chatService.getNewMessage().subscribe((message: string) => {
      this.messages.push(message);
    });

    this.chatService.getFriends().subscribe((friends: User[]) => {
      this.friends = friends;
    });
  }

  onSubmit() {
    const { message } = this.form.value;
    if (!message) return;
    this.chatService.sendMessage(message);
    this.form.reset();
  }

  ngOnDestroy() {
    this.$userSubscription.unsubscribe();
  }
}
