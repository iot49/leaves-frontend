import { html, css, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { shared_css } from './assets/css/shared_styles';
import { consume } from '@lit/context';
import { settingsContext, Settings, Connected, connectedContext, Config, configContext } from './app/contexts';
import { eventbus } from './app/eventbus';
import { app } from '.';


@customElement('leaf-settings')
export class LeafSettings extends LitElement {

  static styles = [
    shared_css,
    css`
      main {
        width: 100vw;
        margin: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .group {
        margin-bottom: 20px;
        padding: 1px 20px;
        border: 1px solid var(--sl-color-neutral-300);
        border-radius: 10px;
        background-color: var(--sl-color-neutral-50);

      }
      h1 {
        font-size: var(--sl-font-size-large);
        font-weight: bold;
        font-variant: small-caps;
        display: flex;
        justify-content: center;
        margin: 0;
        padding: 0;
        margin-bottom: 10px;
      }
      .row {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 300px;
        margin-bottom: 20px;
      }
      .right {
        margin-left: auto;
      }
      sl-icon {
        font-size: 32px;
        margin-right: 16px; 
      }
      sl-button > sl-icon {
        position: relative;
        font-size: 24px;
        /* BUG: icon not centered in button */
        left: 9px;
        top: 3px;
      }
      sl-input {
        width: 100%;
      }
    `
  ];

  @consume({ context: connectedContext, subscribe: true })
  @property({ attribute: false })
  private connected: Connected;

  @consume({ context: configContext, subscribe: true })
  @property({ attribute: false })
  private config: Config;

  @consume({ context: settingsContext, subscribe: true })
  @property({ attribute: false })
  private settings: Settings;
  
  @query('#ota-dialog')
  private ota_dialog;

  @query('#url-dialog')
  private url_dialog;

  @state()
  private available_firmwares = []

  @state()
  private ota_progress: any = 'idle';
  private firmware_size = 0;

  private ota_status(event) {
    event = event.detail;
    if (event.type == 'ota_status') {
      this.ota_progress = event.status  === 'flashing'
        ? Math.floor(100*event.size/this.firmware_size)
        : event.status;
    }
  }
  private ota_status_bound = this.ota_status.bind(this);

  connectedCallback(): void {
    super.connectedCallback();
    (async () => {
      const resp = await fetch(this.settings.firmware_url);
      this.available_firmwares = await resp.json();
    })();
    window.addEventListener('leaf-event', this.ota_status_bound);
  }

  disconnectedCallback(): void {
    window.removeEventListener('leaf-event', this.ota_status_bound);
  }

  rowTemplate(icon: string, desc, control) {
    return html`
      <div class="row">
        <sl-icon name=${icon}></sl-icon>
        <div class="desc">${desc}</div>
        <div class="right">${control}</div>
      </div>
    `;
  }

  render() {
    return html`
      <leaf-page>
        <div slot="nav">Settings</div>
        <main>
          <div id="groups">
            ${this.themeTemplate()}
            ${this.connectionTemplate()}
            ${this.firmwareTemplate()}
            <!-- BUG: required to enable button in firmwareTemplate - go figure! -->
            <div style="visibility: hidden">${this.themeTemplate()}</div>
          </div>

        </main>
      </leaf-page>

      <sl-dialog id="ota-dialog" label="Flashing new firmware ...">
        <sl-progress-bar id="ota-progress" value=${this.ota_progress}>
          ${this.ota_progress + (this.ota_progress instanceof Number ? '%' : '')}
        </sl-progress-bar>
      </sl-dialog>

      <sl-dialog id="url-dialog" label="Cannot determine server URL">
        Load the webpage from the actual server url, not localhost!
      </sl-dialog>
    `
  }

  connectionTemplate() {
    return html`
      <div class="group">
        <!-- connection -->
        <h1>Connection</h1>
        ${this.rowTemplate(
          'cloud-outline',
          html`<sl-input size="small" clearable
            help-text="Application Name"
            value=${this.settings.app_name}
            @sl-change=${e => this.settings.app_name = e.target.value }></sl-input>`,
            ''
        )}
        ${this.rowTemplate(
          'ip-outline',
          html`<sl-input size="small" clearable
            help-text="Backend IP"
            value=${this.settings.backend_ip}
            @sl-change=${e => this.settings.backend_ip = e.target.value }></sl-input>`,
            ''
        )}
        ${this.rowTemplate(
          'connection', 'Connect on startup', 
          html`<sl-switch 
            ?checked=${this.settings.auto_connect}
            @sl-change=${e => this.settings.auto_connect = e.target.checked }></sl-switch>`
        )}
        ${this.connected ? 
            this.rowTemplate('lan-disconnect', 'Disconnect', html`
              <sl-button @click=${() => { this.settings.auto_connect = false;  eventbus.disconnect()}} size="small" variant="primary"><sl-icon name="lan-disconnect"></sl-button>`)
          : this.rowTemplate('lan-connect', 'Connect', html`
              <sl-button @click=${() => eventbus.connect_ble(this.settings.app_name)} size="small" variant="primary"><sl-icon name="bluetooth"></sl-button>
              <sl-button @click=${() => eventbus.connect_ws(this.settings.backend_ws)} size="small" variant="primary"><sl-icon name="wifi"></sl-button>`)}          
      </div>
    `
  }

  themeTemplate() {
    return html`
      <div class="group">
        <!-- theme -->
        <h1>Theme</h1>
        ${this.rowTemplate(
          'theme-light-dark', 'Dark theme', 
          html`<sl-switch 
            ?checked=${this.settings.dark_theme}
            @sl-change=${e => {
              this.settings.dark_theme = e.target.checked;
              document.querySelector('body').setAttribute('theme', e.target.checked ? 'dark' : 'light')
          }}></sl-switch>`
        )}
      </div>
    `
  }

  firmwareTemplate() {
    let version = "?";
    try { version = this.config.app.version } catch {}
    const new_version_available = this.available_firmwares.length > 0 && this.available_firmwares[0].version !== version;

    return html`
      <div class="group">
        <!-- firmware -->
        <h1>Firmware</h1>
        ${this.rowTemplate(
          'memory',
          html`<sl-input size="small" readonly
            help-text="Current Version"
            value=${version}
            @sl-change=${e => this.settings.backend_ip = e.target.value }></sl-input>`,
            ''
        )}
        ${this.rowTemplate(
          'memory-arrow-down',
          html`
            <sl-select size="small" readonly
              help-text="Available Versions"
              value=${version}
              @sl-change=${e => this.settings.backend_ip = e.target.value }>
                ${this.available_firmwares.map((fw) =>
                  html`<sl-option value=${fw.version}>${fw.version}</sl-option>`
                )}
            </sl-select>`,
            ''
        )}
        ${this.rowTemplate(
          'upload-box-outline',
          new_version_available ? 'New Version Available' : 'Up-to-date',
          html`<sl-button size="small" 
            variant=${new_version_available ? 'danger' : 'default'}
            @click=${() => {
              const version = this.renderRoot.querySelector('sl-select').value;
              const fw = this.available_firmwares.find((el) => el.version == version);
              if (!fw) return;
              const url = `${window.origin}/firmware/${fw.file}`;
              if (url.includes('localhost')) {
                app.overlay = this.url_dialog;
                this.url_dialog.show();
                return
              }
              app.overlay = this.ota_dialog;
              this.ota_dialog.show();
              this.firmware_size = fw.size;
              eventbus.postEvent({
                type: 'ota_flash',
                url:  url,
                sha:  fw.sha
              });
        
            }}>
          <sl-icon name="upload"></sl-icon></sl-button>
        `)}
      </div>`
  }

}