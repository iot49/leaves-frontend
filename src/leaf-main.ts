import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import { set, getMany } from 'idb-keyval';

import { type State, stateContext, configContext, logContext, settingsContext, Config, Log, Settings, Connected, connectedContext } from './app/contexts';
import { state_handler, sort_state } from './app/state';
import { eventbus } from './app/app';
import { shared_css } from './assets/css/shared_styles';


export interface App {
  connected: Connected;
  state: State;
  config: Config;
  log: Log;
  settings: Settings;
}

// app-wide access to current state, config, etc.
export let app: App;

function evalInContext(expr, context) {
  return function() { return eval(expr); }.call(context);
}

@customElement('leaf-main')
export class LeafMain extends LitElement implements App {

  static styles = [
    shared_css,
    css`
      #page {
        box-sizing: content-box;
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
      }
    `
  ];

  public connected: Connected = false;
  public state: State = new Map<string, object>();
  public config: Config = {};
  public log = [];

  private _connectedProvider = new ContextProvider(this, { context: connectedContext, initialValue: this.connected });
  private _stateProvider = new ContextProvider(this, { context: stateContext, initialValue: this.state });
  private _configProvider = new ContextProvider(this, { context: configContext, initialValue: this.config });
  private _logProvider = new ContextProvider(this, { context: logContext, initialValue: this.log });
  private _settingsProvider = new ContextProvider(this, { context: settingsContext, initialValue: {} });

  private _settingsLoaded = false;

  private patch_config(cfg) {
    cfg.views[0].cards[0].entities[0].icon = 'plus';
    // cfg.views[0].cards[0].entities[2].unit = '%';
    // cfg.views[0].cards[0].entities[2].format = '.1f';
  }


  private cache = {
    app_name: 'leaf',
    // 10.0.0.225
    backend_ip: "`${this.app_name}.local`",
    backend_ws: "`ws://${this.backend_ip}/ws`",
    auto_connect: false,
    dark_theme: false,
    firmware_url: "/firmware/index.json",
  }

  public settings = new Proxy({cache: this.cache, main: this}, {
    get(target, name, _) {
      if (!target.main._settingsLoaded) return false;
      let v = target.cache[name];
      // expand (nested) backtick expressions, e.g. "`ws://${this.backend_ip}/ws`"
      try { while (v.includes("`")) target[name] = v = evalInContext(v, target.cache); } catch {}
      return v;
    },
    set(target, name, value, _) {
      target.cache[name] = value;
      set(name as string, value);
      target.main._settingsProvider.setValue(target.main.settings, true);
      return true;
    }
  }) as any;
  
  constructor() {
    super();
    app = this;

    // load
    getMany(Object.keys(this.cache)).then(
      (values) => {
        // replace defaults with data loaded from indexedDB
        for (const [i, key] of Object.keys(this.cache).entries()) {
          if (values[i]) this.cache[key] = values[i];
        }
        this._settingsProvider.setValue(this.settings, true);
        this._settingsLoaded = true;
        // app initializations that depend on settings ...
        document.querySelector('body').setAttribute('theme', this.settings.dark_theme ? 'dark' : 'light');
        if (this.settings.auto_connect) eventbus.connect_ws(this.settings.backend_ws);
    })
    
    window.addEventListener('event-bus-status', () => {
      this.connected = eventbus.connected;
      this._connectedProvider.setValue(this.connected, true);
      if (eventbus.connected) {
        eventbus.postEvent({ type: 'get_config' });
        eventbus.postEvent({ type: 'get_state' });
        eventbus.postEvent({ type: 'get_log' });  
      }
    });

    window.addEventListener('event-bus-message',
      (_event: any) => {
        const event = _event.detail;
        switch (event.type) {
          case 'get_config_':
            this.patch_config(event.data);
            this.config = event.data;
            this._configProvider.setValue(this.config, true);
            break;
          case 'get_state_':
            for (const [eid, value] of Object.entries(event.data)) {
              const proxy = new Proxy({ entity_id: eid, value: value }, state_handler);
              this.state.set(eid, proxy);
            }
            this.state = sort_state(this.state);
            this._stateProvider.setValue(this.state, true);
            break;
          case 'get_log_':
            this.log = event.data;
            this._logProvider.setValue(this.log, true);
            break;
          case 'log':
            this._logProvider.setValue([...this._logProvider.value, event]);
            break;
          case 'state_update':
            const new_entity = !this.state.has(event.entity_id);
            const proxy = new Proxy(event, state_handler);
            this.state.set(event.entity_id, proxy);
            if (new_entity) this._stateProvider.setValue(this.state, true);
            this._stateProvider.setValue(this.state, true);
            break;
        }
      });

  }

  render() {
    if (!this._settingsLoaded) {
      setTimeout(() => this.requestUpdate(), 300);
      return html`<sl-spinner></sl-spinner> Loading settings from indexedDB`;
    }
    return html`
      <leaf-router .routes=${[
        { route: "view",     component: "leaf-view" },
        { route: "settings", component: "leaf-settings" },
        { route: "log",      component: "leaf-log" },
        { route: "dev",      component: "leaf-file-editor" },
        { route: "theme",    component: "leaf-theme" },
        { route: "scratch2", component: "leaf-scratch2" },
        { route: "scratch3", component: "leaf-scratch3" },
      ]}></leaf-router>
    `
  }

}
