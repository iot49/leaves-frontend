import { Bus } from './eventbus';
import { app } from '..';
import { html } from 'lit';

export class WsBus implements Bus {

  private _ws: WebSocket;
  private _url: string;
  private _reconnect = true;

  constructor(url: string) {
    // connect to url and try to maintain connection until disconnect is called
    this._url = url;
    this.connect();
  }

  private connect() {
    // throws if connection fails, but cannot be trapped (silenced) with try/catch
    this._ws = new WebSocket(this._url);

    let timer = setInterval(() => {
      if (this._reconnect && !this.connected) {
        // lost connection or never connected
        clearInterval(timer);
        // disable the old ws
        this._ws.removeEventListener("message", this.message_event);
        try { 
          this._ws.close();
        } 
        catch {
          console.log("ws-bus.reconnect - cannot close old ws");
        } 
        // create a new websocket
        this.connect();
      }
    }, 5000);

    const handler = this.status_event.bind(this);
    this._ws.addEventListener("open", handler);
    this._ws.addEventListener("close", handler);
    this._ws.addEventListener("onerror", handler);
    this._ws.addEventListener("message", this.message_event.bind(this));
  }

  public disconnect() {
    this._reconnect = false;
    if (this.connected) this._ws.close();
    // immediately notify of disconnect as the actual close of the ws takes some time
    window.dispatchEvent(new CustomEvent('leaf-connection', { 
      bubbles: true, composed: true, detail: false,
    }));    
  }

  public get connected(): boolean {
    return this._ws ? this._ws.readyState === this._ws.OPEN : false;
  }

  public get status(): number {
    return this._ws ? this._ws.readyState : WebSocket.CLOSED;
  }

  public async send(msg: string) {
    try {
      this._ws.send(msg);
    }
    catch {
      app.overlay = html`<sl-dialog label="WsBus" open>******ws-bus.send failed for ${msg}</sl-dialog>`;
    }
  }

  private message_event(event) {
    window.dispatchEvent(new CustomEvent('leaf-event', { 
      bubbles: true, composed: true, 
      detail: JSON.parse(event.data) 
    }));
  }

  private status_event(event) {
    const state = event.target.readyState;
    if (state !== WebSocket.CONNECTING && state !== WebSocket.OPEN) {
      try {
        event.target.close();
      }
      catch {
        app.overlay = html`<sl-dialog label="WsBus" open>FAILED to close websocket</sl-dialog>`;
      }
    }
    window.dispatchEvent(new CustomEvent('leaf-connection', { 
      bubbles: true, composed: true, detail: this.connected,
    }));
  }

}
