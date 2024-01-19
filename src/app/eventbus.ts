import { WsBus } from './ws-bus';
import { BleBus } from './ble-bus';
import { html } from 'lit';
import { app } from '..';


export interface EventBus {
  readonly connected: boolean;
  connect_ws(url: string);
  connect_ble(app_name: string);
  disconnect();
  postEvent(event: object): Promise<any>;
}

export interface Bus {
  readonly connected: boolean;
  disconnect();
  send(msg: string): Promise<any>;
}


class _EventBus implements EventBus {

  private bus: Bus;
  private wdtId: ReturnType<typeof setInterval>;

  get connected() { return this.bus ? this.bus.connected : false }

  disconnect() {
    if (this.bus) this.bus.disconnect();
    this.bus = null;
  }

  connect_ws(url: string) {
    this.disconnect();
    this.bus = new WsBus(url);
  }

  connect_ble(app_name: string) {
    this.disconnect();
    this.bus = new BleBus(app_name);
  }

  async postEvent(event: object) {
    if (!this.bus) return;
    const msg = JSON.stringify(event);
    let max_msg_length = 50000;
    try { max_msg_length = (window as any).leaf.config.app.max_msg_length; } catch { }
    if (msg.length > max_msg_length) {
      app.overlay = html`<sl-dialog label="notebook.ts" open>message exceeds maximum message length (${msg.length} > ${max_msg_length}), rejected</sl-dialog>`;
    } else {
      this.bus.send(msg);
    }
  }

  constructor() {
    const PING_INTERVAL = 1000;
    const WDT_TIMEOUT = 5000;
    window.addEventListener('leaf-event', _ => {
      // reset wdt to "feed" it
      clearInterval(this.wdtId);
      // start a new wdt
      this.wdtId = setTimeout(this.disconnect.bind(this), WDT_TIMEOUT);
    });
    window.addEventListener('leaf-connection', _ => {
      if (this.connected) {
        const pingId = setInterval(() => {
          if (this.connected) {
            this.postEvent({ type: 'ping' })
          } else {
            clearInterval(pingId);
          }
        }, PING_INTERVAL);
        // detect disconnect if no communication (e.g. pong) from host
        this.wdtId = setTimeout(this.disconnect.bind(this), WDT_TIMEOUT);
      } else {
        // clear the watchdog
        clearInterval(this.wdtId);
      }
    });
  }

}


export const eventbus = new _EventBus();