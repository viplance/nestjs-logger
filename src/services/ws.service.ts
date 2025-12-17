import { Injectable } from '@nestjs/common';
import WebSocket, { WebSocketServer } from 'ws';
import { LogModuleOptions } from '../types';
import { Subject } from 'rxjs';

@Injectable()
export class WsService {
  public onMessage: Subject<any> = new Subject();
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private connectionTimeout: number = 500;
  private options: LogModuleOptions['websocket'] = {
    port: 8080,
    host: 'localhost',
  };
  private key: string = '';

  setupConnection(options: LogModuleOptions['websocket'], key = '') {
    this.options = {
      ...this.options,
      ...options,
    };
    this.key = key;

    // Set up Web Socket server
    if (this.ws) {
      return;
    }

    const wsServer = new WebSocketServer({
      retryCount: 1,
      reconnectInterval: 1,
      handshakeTimeout: this.connectionTimeout,
      port: this.options?.port,
    });

    console.log(
      `Logs WebSocket server is listening on port ${this.options.port}`
    );

    wsServer.on('error', this.handleError);
    wsServer.on('open', () => this.handleOpenConnection());
    wsServer.on('ping', () => this.ping(this.ws));
    wsServer.on('close', () => this.closeConnection(this.ws));
    wsServer.on('message', this.handleMessage);
    wsServer.on('connection', (connection: WebSocket) => {
      this.ws = connection;
      connection.onmessage = this.handleMessage;
    });
  }

  sendMessage(message: any) {
    this.ws?.send(JSON.stringify(message));
  }

  private handleError = () => {
    const serverUrl = this.getServerUrl();
    console.error(`Server ${serverUrl} is not available.`);

    setTimeout(this.setupConnection, this.connectionTimeout);
  };

  private closeConnection = (connection: any) => {
    clearTimeout(connection.pingTimeout);

    if (this.connected) {
      console.log('Connection has been closed by server.');
      this.connected = false;
      this.handleError();
    }
  };

  private ping = (connection: any) => {
    console.log('Ping remote server.');
    clearTimeout(connection.pingTimeout);

    connection.pingTimeout = setTimeout(() => {
      connection.terminate();
    }, 30000 + this.connectionTimeout);
  };

  private handleMessage = (message: any) => {
    try {
      const data = JSON.parse((message.data || message).toString());

      if (this.key !== '' && data.key !== this.key) {
        throw new Error('WebSocket unauthorized');
      }

      if (this.options)
        if (data.action) {
          this.onMessage.next(data);
        }
    } catch (err) {
      console.error(err);
    }
  };

  private getServerUrl = (): string => {
    return `${this.options?.secure ? 'wss' : 'ws'}://${this.options?.host}:${
      this.options?.port
    }`;
  };

  private handleOpenConnection = async () => {
    this.connected = true;
    const serverUrl = this.getServerUrl();
    console.log(`${serverUrl} has been connected.`);
  };
}
