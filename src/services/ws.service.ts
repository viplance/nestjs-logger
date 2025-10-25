import { Injectable } from "@nestjs/common";
import WebSocket, { WebSocketServer } from "ws";
import { LogModuleOptions } from "../types";

@Injectable()
export class WsService {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private connectionTimeout: number = 500;
  private options: LogModuleOptions["websocket"] = {
    port: 8080,
    host: "localhost",
  };

  setupConnection(options: LogModuleOptions["websocket"]) {
    this.options = {
      ...this.options,
      ...options,
    };

    // Set up Web Socket server
    if (this.ws) {
      return;
    }

    const ws = new WebSocketServer({
      retryCount: 1,
      reconnectInterval: 1,
      handshakeTimeout: this.connectionTimeout,
      port: this.options?.port,
    });

    console.log(
      `Logs WebSocket server is listening on port ${this.options.port}`
    );

    ws.on("error", this.handleError);
    ws.on("open", () => this.handleOpenConnection());
    ws.on("ping", () => this.ping(this.ws));
    ws.on("close", () => this.closeConnection(this.ws));
    ws.on("message", this.handleMessage);
    ws.on("connection", (connection: WebSocket) => {
      this.ws = connection;
    });
  }

  sendMessage(message: any) {
    this.ws?.send(JSON.stringify(message));
  }

  handleError = () => {
    const serverUrl = this.getServerUrl();
    console.error(`Server ${serverUrl} is not available.`);

    setTimeout(this.setupConnection, this.connectionTimeout);
  };

  closeConnection = (connection: any) => {
    clearTimeout(connection.pingTimeout);

    if (this.connected) {
      console.log("Connection has been closed by server.");
      this.connected = false;
      this.handleError();
    }
  };

  private ping = (connection: any) => {
    console.log("Ping remote server.");
    clearTimeout(connection.pingTimeout);

    connection.pingTimeout = setTimeout(() => {
      connection.terminate();
    }, 30000 + this.connectionTimeout);
  };

  private handleMessage = (message: any) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Received the message: %s", data);

      if (data.action) {
        switch (data.action) {
          case "toggleRelay":
            break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  private getServerUrl = (): string => {
    return `${this.options?.secure ? "wss" : "ws"}://${this.options?.host}:${
      this.options?.port
    }`;
  };

  private handleOpenConnection = async () => {
    this.connected = true;
    const serverUrl = this.getServerUrl();
    console.log(`${serverUrl} has been connected.`);
  };
}
