import type { IEventBus } from './eventbus';

export class BleBus {

  private event_bus: IEventBus;
  private _connected = false;

  public constructor(event_bus: IEventBus) {
    this.event_bus = event_bus;
  }

  public connect(app_id: string) {
    console.log("BleBus.connect not implemented", app_id);
  }

  public disconnect() {
    // console.log('BleBus.disconnect');
  }

  public get connected(): boolean {
    return this._connected;
  }

  public async postEvent(event) {
    console.log("BleBus.post event", event);
  }

  onmessage(event) {
    console.log("BleBus.onmessage", event);
    this.event_bus.fireOnEvent(event);
  };

  onopen() {
    this._connected = true;
    this.event_bus.fireConnectDisconnectEvent();
  };

  onclose() {
    this._connected = false;
    this.event_bus.fireConnectDisconnectEvent();
  };

}