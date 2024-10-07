import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Socket, SocketIoConfig } from "ngx-socket-io";
import { Observable } from "rxjs";
import { User } from "src/app/auth/models/user.model";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class ChatService {
  private socketConfig: SocketIoConfig = {
    url: "http://localhost:3000",
    options: {},
  };
  public socket: Socket;

  constructor(private http: HttpClient) {
    this.socket = new Socket(this.socketConfig);
  }

  sendMessage(msg: string) {
    this.socket.emit("sendMessage", msg);
  }

  getNewMessage(): Observable<string> {
    return this.socket.fromEvent<string>("newMessage");
  }

  getFriends(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.baseApiUrl}/user/friends/my`);
  }
}
