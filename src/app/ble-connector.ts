const _CONNECTOR_SERVICE = "4d8b9851-05af-4ea0-99a5-cdbf9fd4104b";
const _CONNECTOR_RX      = "4d8b9852-05af-4ea0-99a5-cdbf9fd4104b";
const _CONNECTOR_TX      = "4d8b9853-05af-4ea0-99a5-cdbf9fd4104b";

const _MSG_PART          = 0x1
const _MSG_COMPLETE      = 0x2

const _MTU               = 512

if (!("TextEncoder" in window)) 
    alert("Browser does not support TextEncoder, please upgrade!");

/*
if (!("bluetooth" in navigator))
    alert("Browser does not support Bluetooth, please upgrade!")
*/

function assert(condition: boolean, msg?: string) {
    if (!condition) {
        console.log("***** Assertion", msg)
    }
}

export class BLEConnector {

    private device = null;
    private rx_characteristic;
    private event_listener = undefined;
    private connection_cb = undefined;
    private rx_buffer = "";

    constructor() {
        // event_listener: called when data is received from peripheral
        this.onDisconnected = this.onDisconnected.bind(this);
    }

    public addEventListener(event_listener) {
        // only a single cb for now
        this.event_listener = event_listener;
    }

    public addConnectionListener(connection_cb) {
        // report connection status changes
        this.connection_cb = connection_cb;
    }

    public async connectDisconnect() {
        // toggle connection status
        if (this.device) {
            // already connected - disconnect
            console.log("disconnect");
            this.disconnect();
            return;
        }
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{
                    services: [_CONNECTOR_SERVICE]
                }]
            });
            console.log("connected to", this.device.name);
            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
            const server  = await this.device.gatt.connect();
            const service = await server.getPrimaryService(_CONNECTOR_SERVICE);
            const tx_char = await service.getCharacteristic(_CONNECTOR_TX);
            tx_char.startNotifications()
            tx_char.addEventListener('characteristicvaluechanged', this.valueChanged.bind(this));
            this.rx_characteristic = await service.getCharacteristic(_CONNECTOR_RX);
            // console.log("indicate: TX", tx_char.properties.indicate, "RX", this.rx_char.properties.indicate);
            if (this.connection_cb) this.connection_cb(true);
        } catch (error) {
            console.error("***** connect:", error);
        }
    }

    public async postEvent(event: object) {
        // send data to peripheral
        if (this.device == null) return;
        assert("type" in event, "no type property in " + event);
        
        const enc = new TextEncoder();    
        const msg = enc.encode(JSON.stringify(event));
        // max ble message length
        const N = _MTU - 1;  // one byte for type

        // split message into chunks
        for (let index=0;  index < msg.length;  index+=N) {
            const data = msg.subarray(index, index+N);
            const x = new Uint8Array(data.length+1);
            // prepend message with type code
            const last = index+N >= msg.length;
            x[0] = last ? _MSG_COMPLETE : _MSG_PART;
            x.set(data, 1);
            await this.rx_characteristic.writeValue(x);
        }        
    }

    public disconnect() {
        // disconnect from peripheral
        if (!this.device) return;
        return this.device.gatt.disconnect();
    }

    public get connected(): boolean {
        return this.device !== null;
    } 

    private onDisconnected() {
        this.device = null;
        if (this.connection_cb) this.connection_cb(false);
    }
 
    private valueChanged(event) {
        const dec = new TextDecoder("utf-8");
        const data = new Uint8Array(event.target.value.buffer);
        // split off 1st byte (_MSG_PART / _MSG_COMPLETE) and convert to string
        const msg = dec.decode(data.slice(1, data.length));
        // assemble parts
        this.rx_buffer += msg;
        if (event.target.value.getUint8(0) == _MSG_COMPLETE) {
            // complete json message
            // console.log("GOT", typeof this.rx_buffer, this.rx_buffer); 
            if (this.event_listener) {
                this.event_listener(JSON.parse(this.rx_buffer));
            }
            this.rx_buffer = "";
        }
    }

}
