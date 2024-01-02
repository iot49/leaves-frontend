import { LitElement, PropertyValueMap, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { eventbus } from './app/eventbus';
import { korCheckbox, korInput } from './kor';
import { get, set } from 'idb-keyval';
import { consume } from '@lit/context';
import { Config, Log, configContext, logContext, stateContext } from './app/contexts';
import { State } from './app/state';
import { getFSRoot } from './app/app';

@customElement('leaf-router')
export class LeafRouter extends LitElement {

  @consume({ context: configContext, subscribe: true })
  @property({ attribute: false })
  private config: Config;

  @consume({ context: stateContext, subscribe: true })
  @property({ attribute: false })
  private state: State;

  @consume({ context: logContext, subscribe: true })
  @property({ attribute: false })
  private log: Log;

  @property({ attribute: false })
  private routes = [];

  @state()
  private route = "view";

  @state()
  private connected = false;

  @state()
  private fsRoot: FileSystemDirectoryHandle;

  @state()
  private connectionParams: any;

  static styles = css`
    #views {
      display: flex;
    }
    #routes {
      visibility: hidden;
    }
    .field {
      display: flex;
      margin-top: 2rem;
      align-items: center;
    }
    kor-input, kor-checkbox {
      margin-right: 2rem;
    }
    .hide {
      visibility: hidden;
    }
  `

  constructor() {
    super();
    super.connectedCallback();
    window.addEventListener('go', (event: CustomEvent)  => this.go(event.detail.location));
    window.addEventListener('event-bus-connected', () => {
      this.connected = true;
      eventbus.postEvent({ type: 'get_config' });
      eventbus.postEvent({ type: 'get_state' });
      eventbus.postEvent({ type: 'get_log' });
    });
    window.addEventListener('event-bus-disconnected', () => this.connected = false);
  }

  protected go(location="/") {
    this.route = location.match(/\/?([\w\d-]*)/)[1];
  }

  async connectedCallback() {
    super.connectedCallback();
    get('connection-params').then((val) => this.connectionParams = val);
  }

  protected shouldUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): boolean {
    return _changedProperties.size > 0;
  }

  protected loadingTemplate(msg="Loading configuration ...") {
    return html`
      <kor-modal id="loading" label=${msg} width="500px" height="200px" visible sticky>
        <kor-spinner></kor-spinner>
      </kor-modal>
    `
  }

  protected connectTemplate() {
    function save(_this) {
      const auto = (_this.renderRoot.querySelector('#auto-connect') as korCheckbox).active;
      const url = (_this.renderRoot.querySelector('#ws') as korInput).value;
      const app = (_this.renderRoot.querySelector('#ble') as korInput).value;
      // save connection parameters
      _this.connectionParams = { autoconnect: auto, url: url, app: app };
      set('connection-params', _this.connectionParams);
    }

    return html`
      <kor-modal label="Connect" icon="train" width="500px" height="260px" flexDirection="column" visible sticky>
        <div class="field">
          <kor-input id="ws" label="WS URL" value="ws://leaf.local/ws"></kor-input>
          <kor-checkbox id="auto-connect" label="Auto" ?active=${this.connectionParams.autoconnect}></kor-checkbox>
          <button id="ws-button">
            <kor-button @click=${() => { save(this);  eventbus.connect_ws(this.connectionParams.url); } } 
                label="Connect WS" color="primary">
              <kor-icon icon="wifi" color="white" size="m"></kor-icon>
            </kor-button>
          </button>
        </div>

        <div class="field">
          <kor-input id="ble" label="app" value="RV"></kor-input>
          <kor-checkbox class="hide" label="Auto"></kor-checkbox>
          <kor-button @click=${() => { save(this);  eventbus.connect_ble(this.connectionParams.app); } }
            label="Connect BLE" color="primary" disabled>
            <kor-icon icon="bluetooth" color="white" size="m"></kor-icon>
          </kor-button>
        </div>
      </kor-modal>
    `
  }

  protected filesystemTemplate() {
    return html`
      <kor-modal id="loading" label="File Access" width="400px" height="150px" visible sticky>
        Access to local files required!
        <kor-button @click=${() => this.go()} label="OK" color="primary"></kor-button>
      </kor-modal>
    `
  }

  render() {
    const target = this.routes.find(item => item.route === this.route) || this.routes[0];
    // console.log("ROUTER.render", target);
    // connect
    if ("connect" in target && !this.connected) {
      if (!this.connectionParams) {
        return this.loadingTemplate("Loading connection parameters ...");
      }
      if (this.connectionParams.autoconnect) {
        eventbus.connect_ws(this.connectionParams.url);
        return this.loadingTemplate("Connecting ...");
      } else {
        return this.connectTemplate();
      }
    }
    // load configuration
    if ("connect" in target && (!this.config || !this.state || !this.log)) {
      return this.loadingTemplate("Loading configuration ...");
    }
    // file system ...
    if ("file_system" in target && !this.fsRoot) {
      getFSRoot().then(
        function(dir) { 
          // force render
          this.fsRoot = dir; 
        }.bind(this),
        function(_) {}
      )
      return this.filesystemTemplate();
    }
    // target
    if (!("element" in target)) {

      target.element = document.createElement(target.component);
    }

    return html`${target.element}`
  }

}
