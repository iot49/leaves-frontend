export class BleBus {

  private _connected = false;

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
  };

  onopen() {
    this._connected = true;
  };

  onclose() {
    this._connected = false;
  };

}