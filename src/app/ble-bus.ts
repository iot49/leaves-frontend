import { queue, QueueObject } from "async-es";
import { html } from "lit";
import { app } from "..";

const _CONNECTOR_SERVICE = "4d8b9851-05af-4ea0-99a5-cdbf9fd4104b";
const _CONNECTOR_RX      = "4d8b9852-05af-4ea0-99a5-cdbf9fd4104b";
const _CONNECTOR_TX      = "4d8b9853-05af-4ea0-99a5-cdbf9fd4104b";
// const _ADV_MANUFACTURER  = 0xa748;

const _MSG_PART          = 0x1;
const _MSG_COMPLETE      = 0x2;

const _MTU               = 512;   // TODO: get from server?

if (!("TextEncoder" in window)) 
    app.overlay = html`<sl-dialog label="BleBus" open>Browser does not support TextEncoder, please upgrade!</sl-dialog>`;

/*
if (!("bluetooth" in navigator))
    app.overlay = html`<sl-dialog label="BleBus" open>Browser does not support Bluetooth, please upgrade!</sl-dialog>`;
*/


export class BleBus {

  private device = null;
  private rx_characteristic;
  private rx_buffer = "";
  private send_queue: QueueObject;

  constructor(app_name: string) {
    this.connect(app_name);
  }

  public async connect(app_name?: string) {
    this.disconnect();
    try {
      const filters: any[] = [ { 
        services: [_CONNECTOR_SERVICE],
        // manufacturerData: [{ companyIdentifier: _ADV_MANUFACTURER }]
      } ];
      if (app_name && app_name !== '*') filters.push({ name: app_name });
      const device = await navigator.bluetooth.requestDevice({ filters: filters });
      console.log("connecting to", device.name, 'app-name =', app_name);
      console.log('A0', device, device.name);
      device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
      console.log('A1', device);
      const server  = await device.gatt.connect();
      console.log('A2');
      const service = await server.getPrimaryService(_CONNECTOR_SERVICE);
      console.log('A3');
      const tx_char = await service.getCharacteristic(_CONNECTOR_TX);
      tx_char.startNotifications()
      console.log('A4');
      tx_char.addEventListener('characteristicvaluechanged', this.valueChanged.bind(this));
      console.log('A5');
      this.rx_characteristic = await service.getCharacteristic(_CONNECTOR_RX);
      console.log('A6');
      // FIX this.device = device;   // indicates we have a connection
      console.log('A7');
      window.dispatchEvent(new CustomEvent('leaf-connection', { 
        bubbles: true, 
        composed: true, 
        detail: this.connected,
      }));
      console.log('A8');
    } catch (error) {
      console.error("***** connect:", error, this.device);
  }

  }

  public disconnect() {
    if (!this.device) return;
    console.log('ble-bus.disconnect')
    this.device.gatt.disconnect();
    this.device = null;
    this.send_queue = null;
  }

  public get connected(): boolean { return this.device !== null; }

  public async send(msg: string) {
    console.log('send', msg)
    if (!this.send_queue) {
      this.send_queue = queue(async (task, callback) => {
        if (!this.connected) { 
          console.log("ble-bus disconnected, discarding", task); 
          callback(); 
          return; 
        }
        console.log('send process', task);
        const encoded = (new TextEncoder()).encode(task);
        // max ble message length
        const N = _MTU - 1;  // one byte for type
    
        // split message into chunks
        for (let index=0;  index < task.length;  index+=N) {
            const data = encoded.subarray(index, index+N);
            const x = new Uint8Array(data.length+1);
            // prepend message with type code
            const last = index+N >= task.length;
            x[0] = last ? _MSG_COMPLETE : _MSG_PART;
            x.set(data, 1);
            await this.rx_characteristic.writeValue(x);
        }   
        callback(); 
      });
    }
    this.send_queue.push(msg);
  }

  private onDisconnected() {
    this.device = null;
    console.log('ble-bus.onDisconnected')
    window.dispatchEvent(new CustomEvent('leaf-connection', { 
      bubbles: true, 
      composed: true, 
      detail: this.connected,
    }));
  }

  private valueChanged(event) {
    const dec = new TextDecoder("utf-8");
    const data = new Uint8Array(event.target.value.buffer);
    // split off 1st byte (_MSG_PART / _MSG_COMPLETE) and convert to string
    const msg = dec.decode(data.slice(1, data.length));
    console.log('valueChanged', msg);
    // assemble parts
    this.rx_buffer += msg;
    if (event.target.value.getUint8(0) == _MSG_COMPLETE) {
        // complete json message
        try {
          const event = JSON.parse(this.rx_buffer);
          this.rx_buffer = "";  
          window.dispatchEvent(new CustomEvent('leaf-event', { 
            bubbles: true, composed: true, 
            detail: event
          }));    
        } catch(error) {
          console.log("***** ble-bus.valueChanged", error, this.rx_buffer);
        }
    }
  }

}