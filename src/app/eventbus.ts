import { WsBus }  from './ws-bus';
import { BleBus }  from './ble-bus';
import { Router } from '@vaadin/router';

export type ConnectDisconnectEventListener = () => void;

export type OnEventListener = (message: object) => void;

export interface IEventBus {
  connected: boolean;

  //scan_ble();

  disconnect();
  connect_ws(url: string);
  connect_ble(app_name: string);

  /* async */ postEvent(event: object): Promise<any>;
  
  addConnectDisconnectEventListener(listener: ConnectDisconnectEventListener);
  removeConnectDisconnectEventListener(listener: ConnectDisconnectEventListener);

  addOnEventListener(listener: OnEventListener);
  removeOnEventListener(listener: OnEventListener);

  fireConnectDisconnectEvent();
  fireOnEvent(msg: string);

} 


export class EventBus implements IEventBus {

  private ws = new WsBus(this);
  private ble = new BleBus(this);
  private wdt: ReturnType<typeof setInterval>;

  private _connectDisconnectEventListeners = new Array<ConnectDisconnectEventListener>();
  private _onEventListeners = new Array<OnEventListener>();

  get connected() {
    return this.ws.connected || this.ble.connected;
  }

  //scan_ble() {}

  disconnect() {
    this.ws.disconnect();
    this.ble.disconnect();
  }

  connect_ws(url: string) {
    if (this.connected) {
      console.log('EventBus.connect_ws: already connected (ignored)', url);
      return;
    }
    this.ws.connect(url);
  }

  connect_ble(app_name: string) {
    if (this.connected) {
      console.log('EventBus.connect_ble: already connected (ignored)', app_name);
      return;
    }
    this.ble.connect(app_name);

  }

  async postEvent(event: object) {
    // usually only one will be connected
    const msg = JSON.stringify(event);
    if (this.ws.connected) this.ws.postEvent(msg);
    if (this.ble.connected) this.ble.postEvent(msg);
  }

  addConnectDisconnectEventListener(listener: ConnectDisconnectEventListener) {
    if (this._connectDisconnectEventListeners.includes(listener)) return;
    this._connectDisconnectEventListeners.push(listener);
  }

  removeConnectDisconnectEventListener(listener: ConnectDisconnectEventListener) {
    const index = this._connectDisconnectEventListeners.indexOf(listener);
    if (index > -1) this._connectDisconnectEventListeners.splice(index, 1);
  }

  addOnEventListener(listener: OnEventListener) {
    if (this._onEventListeners.includes(listener)) return;
    this._onEventListeners.push(listener);
  }

  removeOnEventListener(listener: OnEventListener) {
    const index = this._onEventListeners.indexOf(listener);
    if (index > -1) this._onEventListeners.splice(index, 1);
  }

  fireConnectDisconnectEvent() {
    if (this.connected) {
      setInterval(() => this.postEvent({ type: 'ping' }), 1000);
      // detect disconnect if no communication (e.g. pong) from host
      this.wdt = setTimeout(this.wdt_timeout.bind(this), 2000);
      // show default page
      Router.go('/');
    } else {
      // clear the watchdog
      clearInterval(this.wdt);
      // show connect page
      Router.go('/connect');
    }
    this._connectDisconnectEventListeners.forEach((listener) => listener());
  }

  fireOnEvent(msg: string) {
    // reset wdt to "feed" it
    clearInterval(this.wdt);
    this.wdt = setTimeout(this.wdt_timeout.bind(this), 2000);
    // get event data and call subscribers
    const event = JSON.parse(msg);
    this._onEventListeners.forEach((listener) => listener(event));
  }

  private wdt_timeout() {
    console.log("eventbus.wdt - disconnect");
    this.disconnect();
    Router.go('/connect');
  }

}