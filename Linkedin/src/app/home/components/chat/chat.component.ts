import { CommonModule } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { ChatService } from "../../services/chat.service";
import { Observable } from "rxjs";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
  imports: [IonicModule, CommonModule, FormsModule],
  standalone: true,
})
export class ChatComponent implements OnInit {
  @ViewChild("form") form!: NgForm;

  messages: string[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chatService.getMessage().subscribe((msg) => {
      this.messages.push(msg);
    });
  }

  onSubmit() {
    const { message } = this.form.value;
    if (!message) {
      return;
    }
    this.chatService.sendMessage(message);
    this.form.reset();
  }
}
