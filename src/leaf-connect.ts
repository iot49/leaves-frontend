import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { type IEventBus, eventbusContext } from './app/contexts';


if (!("TextEncoder" in window))
  alert("Browser does not support TextEncoder, please upgrade!");

//  if (!("bluetooth" in navigator))
//    alert("Browser does not support Bluetooth, please upgrade!")


@customElement('leaf-connect')
export class LeafConnect extends LitElement {

  @consume({ context: eventbusContext, subscribe: true })
  @property({ attribute: false })
  private eventbus: IEventBus;

  @state() 
  private connecting = false;

  static styles = css`
    .main {
      /* background-image: url('/leaves.png'); */
      height: 100vh;
    }
    .field {
      display: flex;
      margin: 2rem;
      align-items: center;
    } 
    .field kor-input {
      margin-right: 30px;
    }
    .field kor-input {
      width: 300px;
    }
  `

  render() {
    if (this.connecting) {
      return html`<kor-spinner label="Connecting ..."></kor-spinner>`
    }
    if (this.eventbus.connected) {
      return html`
        <leaf-page>
          <nav slot="nav">Disconnect</nav>

          <div class="field">
            disconnect
            <kor-button @click=${this.disconnect} label="Disconnect">
              <kor-icon icon="close" color="white" size="m"></kor-icon>
            </kor-button>
          </div>

        </leaf-page>
      `
    }
    return html`
      <leaf-page>
        <nav slot="nav">Connect</nav>

        <div class="field">
            <kor-input id="ws" label="WS URL" value="ws://leaf.local/ws"></kor-input>
            <kor-button @click=${this.connect_ws} label="Connect WS" color="primary">
                <kor-icon icon="wifi" color="white" size="m"></kor-icon>
            </kor-button>
        </div>

        <div class="field">
            <kor-input id="ble" label="APP" value="RV"></kor-input>
            <kor-button @click=${this.connect_ble} label="Connect BLE" color="primary">
                <kor-icon icon="bluetooth" color="white" size="m"></kor-icon>
            </kor-button>
        </div>
      </leaf-page>
    `;
  }

  connect_ws() {
    this.connecting = true;
    const ws_url = (this.shadowRoot.getElementById('ws') as any).value;
    this.eventbus.connect_ws(ws_url);
  }

  connect_ble() {
    this.connecting = true;
    const ws_ble = (this.shadowRoot.getElementById('ble') as any).value;
    this.eventbus.connect_ble(ws_ble);
  }

  disconnect() {
    this.eventbus.disconnect();
  }

}
