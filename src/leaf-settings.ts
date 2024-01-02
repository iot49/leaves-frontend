import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { type Config, configContext } from './app/contexts';
import { go, eventbus } from './app/app';

@customElement('leaf-settings')
export class LeafSettings extends LitElement {

  @consume({ context: configContext, subscribe: true })
  @property({ attribute: false })
  private config: Config;

  @state()
  private firmware_index = [];

  @state()
  private upgrading = false;

  @state()
  private ota_status: any = {};
  private firmware_size = 1;

  constructor() {
    super();
    (async () => {
      const resp = await fetch("/firmware/index.json");
      this.firmware_index = await resp.json();
    })();
  }

  static styles = css`
    main {
      max-width: 28rem;
      margin: 2rem;
    }

    .section {
      display: flex;
      align-items: center;
      margin-bottom: 50px;
    }

    kor-input[label="Current"] {
      width: 6rem;
      margin-right: 1rem;
    }
    kor-input[label="New"] {
      width: 12rem;
      margin-right: 1rem;
    }
    kor-button {
      margin-left: 2rem;
    }
    kor-progress-bar {
      margin: auto;
      margin-top: 100px;
      width: 80%;
    }
  `

connectedCallback(): void {
  super.connectedCallback();
  this.addEventListener('event-bus-message', event => { if (event.type == 'ota_status') this.ota_status = event } );
}

configTemplate() {
    return html`
      <h1>Configuration:</h1>

      <div class="section">
        <div class="part">
          <kor-input label="Section" type="select">
            ${Object.keys(this.config).sort().map((section) =>
              html`<kor-menu-item label=${section}></kor-menu-item>`
            )}
          </kor-input>
        </div>
        <kor-button @click=${this.update_firmware} label="Edit" icon="edit"></kor-button>
      </div>
      <div class="section">
        <kor-button @click=${this.update_firmware} label="Backup" icon="edit"></kor-button>
        <kor-button @click=${this.update_firmware} label="Restore" icon="edit"></kor-button>
        <kor-button @click=${this.update_firmware} label="Reset" icon="edit"></kor-button>
      </div>
    `
  }

  firmwareTemplate() {
    const fi = this.firmware_index;
    const new_version =  fi.length > 0 
        ? (fi[0].version === this.config.app.version ? 'up-to-date' : fi[0].version)
         : 'not available';

    return html`
      <h1>Firmware:</h1>

      <div class="section" ?hidden=${this.upgrading}>
        <kor-input label="Current" value=${this.config.app.version} readonly></kor-input>
        <kor-input id="new_version" label="New" type="select" value=${new_version}>
          ${fi.map((fw) =>
            html`<kor-menu-item label=${fw.version}></kor-menu-item>`
          )}
        </kor-input>
        <kor-button @click=${this.update_firmware} label="Upgrade" icon="edit"></kor-button>
      </div>
    `
  }

  upgradeTemplate() {
    switch (this.ota_status.status) {
      case 'flashing':
        return html`
          <kor-progress-bar 
            label="Progress" 
            color="rgb(var(--accent-1))" show-progress size="m"
            value=${Math.floor(100*this.ota_status.size/this.firmware_size)}>
          </kor-progress-bar>
        `
      case 'rebooting':
        window.alert('rebooting');
        go('/');
        return html`rebooting`;
      case 'not found':
        window.alert('cannot download firmware');
        return html`cannot download firmware`;
      default:
        return html`unknown status ${this.ota_status.status}`;
    }
  }


  render() {
    if (!this.config) return html``;

    if (this.upgrading) {
      return html`
        <leaf-page>
          <nav slot="nav">Upgrading ...</nav>
          ${this.upgradeTemplate()}
        </leaf-page>
      `
    }

    return html`
      <leaf-page>
        <nav slot="nav">Settings</nav>
        <main>
          ${this.configTemplate()}
          ${this.firmwareTemplate()}
        </main>
      </leaf-page>
    `
  }

  update_firmware() {
    // send ota command ...
    const version = (this.shadowRoot.getElementById('new_version') as any).value;
    const fw = this.firmware_index.find((el) => el.version == version);
    if (fw) {
      this.firmware_size = fw.size;
      eventbus.postEvent({
        type: 'ota_flash',
        url:  `${window.origin}/firmware/${fw.file}`,
        sha:  fw.sha
      });
      this.upgrading = true;
    } else {
      window.alert("choose a firmware version!");
    }
  }

}
