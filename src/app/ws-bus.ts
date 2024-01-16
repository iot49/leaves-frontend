export class WsBus {

  private ws: WebSocket;
  private _auto_connect = true;

  public connect(url: string) {
    // throws if connection fails, but cannot be trapped with try/catch
    this.ws = new WebSocket(url);

    let timer = setInterval(() => {
      if (this._auto_connect && !this.connected) {
        // lost connection or never connected
        clearInterval(timer);
        // disable the old ws
        this.ws.removeEventListener("message", this.message_event);
        try { 
          this.ws.close();
        } 
        catch {
          console.log("ws-bus.reconnect - cannot close old ws");
        } 
        // create a new websocket
        this.connect(this.ws.url);
      }
    }, 2000);

    this.ws.addEventListener("message", this.message_event);
    this.ws.addEventListener("open", this.status_event);
    this.ws.addEventListener("close", this.status_event);
    this.ws.addEventListener("onerror", this.status_event);

  }

  public disconnect() {
    this._auto_connect = false;
    if (this.connected) this.ws.close();
  }

  public get auto_connect() {
    return this._auto_connect;
  }

  public set auto_connect(ac: boolean) {
    this._auto_connect = ac;
  }

  public get connected(): boolean {
    return this.ws && (this.ws.readyState === this.ws.OPEN);
  }

  public get status(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  public postEvent(msg: any) {
    try {
      this.ws.send(msg);
    }
    catch {
      console.log("******ws-bus.send failed for", msg);
    }
  }

  private message_event(event) {
    window.dispatchEvent(new CustomEvent('event-bus-message', { 
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
        console.log("FAILED to close websocket");
      }
    }
    window.dispatchEvent(new CustomEvent('event-bus-status', { 
      bubbles: true, composed: true, 
      detail: state
    }));
  }

}
