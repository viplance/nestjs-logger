import { Injectable } from '@nestjs/common';
import WebSocket, { WebSocketServer } from 'ws';
import { LogModuleOptions } from '../types';
import { Subject } from 'rxjs';

@Injectable()
export class WsService {
  public onMessage: Subject<any> = new Subject();
  private clients: Set<any> = new Set();
  private connectionTimeout: number = 500;
  private options: LogModuleOptions['websocket'] = {
    port: 8080,
    host: 'localhost',
  };
  private key: string = '';
  private wsServer: any | null = null;

  setupConnection(options: LogModuleOptions['websocket'], key = '') {
    this.options = {
      ...this.options,
      ...options,
    };
    this.key = key;

    // Set up Web Socket server
    if (this.wsServer) {
      return;
    }

    this.wsServer = new WebSocketServer({
      retryCount: 1,
      reconnectInterval: 1,
      handshakeTimeout: this.connectionTimeout,
      port: this.options?.port,
    });

    console.log(
      `Logs WebSocket server is listening on port ${this.options.port}`
    );

    this.wsServer.on('error', this.handleError);
    this.wsServer.on('listening', () => this.handleOpenConnection());
    this.wsServer.on('close', () => {
      console.log('WebSocket server closed.');
      this.wsServer = null;
    });

    this.wsServer.on('connection', (connection: any) => {
      this.clients.add(connection);

      connection.on('message', (message: any) => this.handleMessage(message));

      connection.on('close', () => {
        this.clients.delete(connection);
      });

      connection.on('error', () => {
        this.clients.delete(connection);
      });
    });
  }

  sendMessage(message: any) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private handleError = () => {
    const serverUrl = this.getServerUrl();
    console.error(`Server ${serverUrl} is not available.`);

    // If server failed, reset instance so retry can happen
    this.wsServer = null;

    setTimeout(() => this.setupConnection(this.options, this.key), this.connectionTimeout);
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
    return `${this.options?.secure ? 'wss' : 'ws'}://${this.options?.host}:${this.options?.port
      }`;
  };

  private handleOpenConnection = async () => {
    const serverUrl = this.getServerUrl();
    console.log(`${serverUrl} has been connected.`);
  };
}
