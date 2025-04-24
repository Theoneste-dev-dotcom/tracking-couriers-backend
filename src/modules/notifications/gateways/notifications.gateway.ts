import { Inject, Injectable } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*'
    }
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private clients:Map<number, string> = new Map(); // stores userId -> socketId mappings

    handleConnection(client: Socket, ...args: any[]) {
        console.log(`Client Connected: ${client.id}`)
    }

    handleDisconnect(client:Socket) {
        console.log(`Client disconnected: ${client.id}`)

        this.clients.forEach((socketId, userId) => {
            if(socketId == client.id) {
                this.clients.delete(userId)
            }
        })
    }

    registerClient(userId:number, clientId:string){
        this.clients.set(userId, clientId);
    } 

    sendNotificationToUser(userId:number, notification:any) {
        const socketId = this.clients.get(userId);

        if(socketId) {
            this.server.to(socketId).emit('notification', notification);
        }
    }
}