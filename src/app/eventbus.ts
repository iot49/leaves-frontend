import { WsBus } from './ws-bus';
import { BleBus } from './ble-bus';


export interface EventBus {
  connected: boolean;
  status: number;  /* WebSocket.readyState */
  auto_connect: boolean;
  disconnect();
  connect_ws(url: string);
  connect_ble(app_name: string);
  /* async */ postEvent(event: object): Promise<any>;
}


class _EventBus implements EventBus {

  private ws = new WsBus();
  private ble = new BleBus();
  private wdt: ReturnType<typeof setInterval>;

  get connected() {
    return this.ws.connected || this.ble.connected;
  }

  get status(): number {
    return this.ws.status;
  }

  public get auto_connect() {
    return this.ws.auto_connect;
  }

  public set auto_connect(ac: boolean) {
    this.ws.auto_connect = ac;
  }

  disconnect() {
    this.ws.disconnect();
    this.ble.disconnect();
  }

  connect_ws(url: string) {
    this.disconnect()
    this.ws.connect(url);
  }

  connect_ble(app_name: string) {
    this.disconnect()
    this.ble.connect(app_name);
  }

  async postEvent(event: object) {
    // usually only one will be connected
    const msg = JSON.stringify(event);
    let max_msg_length = 50000;
    try { max_msg_length = (window as any).leaf.config.app.max_msg_length; } catch { }
    if (msg.length > max_msg_length) {
      console.log(`message exceeds maximum message length (${msg.length} > ${max_msg_length}), rejected`)
    } else {
      if (this.ws.connected) this.ws.postEvent(msg);
      if (this.ble.connected) this.ble.postEvent(msg);
    }
  }

  constructor() {
    const PING_INTERVAL = 1000;
    const WDT_TIMEOUT = 5000;
    window.addEventListener('event-bus-message', _ => {
      // reset wdt to "feed" it
      clearInterval(this.wdt);
      this.wdt = setTimeout(this.disconnect.bind(this), WDT_TIMEOUT);
    });
    window.addEventListener('event-bus-status', _ => {
      if (this.ws.connected) {
        setInterval(() => this.postEvent({ type: 'ping' }), PING_INTERVAL);
        // detect disconnect if no communication (e.g. pong) from host
        this.wdt = setTimeout(this.disconnect.bind(this), WDT_TIMEOUT);
      } else {
        // clear the watchdog
        clearInterval(this.wdt);
      }
    });
  }

}


export const eventbus = new _EventBus();