import type { IEventBus } from './eventbus';

export class WsBus {

  private event_bus: IEventBus;
  private ws: WebSocket;
  private _connected = false;

  public constructor(event_bus: IEventBus) {
    this.event_bus = event_bus;
  }

  public connect(url: string) {
    // console.log("ws-bus.connect", url);
    this.ws = new WebSocket(url);

    this.ws.addEventListener("message", (event) => {
      this.event_bus.fireOnEvent(event.data);
    });

    this.ws.addEventListener("open", () => {
      this._connected = true;
      this.event_bus.fireConnectDisconnectEvent();
    });

    this.ws.addEventListener("close", () => {
      this._connected = false;
      this.event_bus.fireConnectDisconnectEvent();
    });

  }

  public disconnect() {
    this._connected = false;
    this.ws.close();
  }

  public get connected(): boolean {
    return this._connected;
  }

  public postEvent(msg: any) {
    if (this.connected) {
      try {
        this.ws.send(msg);
      }
      catch {
        console.log("send failed for", msg);
      }
    }
  }

}
