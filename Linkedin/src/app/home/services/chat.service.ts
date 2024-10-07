import { Injectable } from "@angular/core";
import { Socket, SocketIoConfig } from "ngx-socket-io";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ChatService {
  private socketConfig: SocketIoConfig = {
    url: "http://localhost:3000",
    options: {},
  };
  public socket: Socket;

  constructor() {
    this.socket = new Socket(this.socketConfig);
  }

  sendMessage(msg: string) {
    this.socket.emit("sendMessage", msg);
  }

  getMessage(): Observable<string> {
    return this.socket.fromEvent<string>("newMessage");
  }
}
