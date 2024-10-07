import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:8100',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  handleConnection() {
    console.log('New connection');
  }

  handleDisconnect() {
    console.log('Disconnect');
  }

  @SubscribeMessage('sendMessage')
  handleMessage(socket: Socket, message: string) {
    console.log('received message: ', message);
    this.server.emit('newMessage', message);
  }
}
