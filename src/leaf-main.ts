import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';

import { type State, stateContext, configContext, logContext } from './app/contexts';
import { state_handler, sort_state } from './app/state';


@customElement('leaf-main')
export class LeafMain extends LitElement {

  private _state: State = new Map<string, object>();
  private _stateProvider = new ContextProvider(this, { context: stateContext, initialValue: this._state });
  private _configProvider = new ContextProvider(this, { context: configContext });
  private _logProvider = new ContextProvider(this, { context: logContext });

  private patch_config(cfg) {
    cfg.views[0].cards[0].entities[0].icon = 'add_circle';
    // cfg.views[0].cards[0].entities[2].unit = '%';
    // cfg.views[0].cards[0].entities[2].format = '.1f';
  }
  
  constructor() {
    super();
    this._logProvider.setValue([]);
    // make state and config available globally
    (window as any).leaf = {};
    (window as any).leaf.state = this._state;

    window.addEventListener('event-bus-message',
      (_event: any) => {
        const event = _event.detail;
        switch (event.type) {
          case 'get_config_':
            this.patch_config(event.data);
            this._configProvider.setValue(event.data, true);
            (window as any).leaf.config = event.data;
            break;
          case 'get_state_':
            for (const [eid, value] of Object.entries(event.data)) {
              const proxy = new Proxy({ entity_id: eid, value: value }, state_handler);
              this._state.set(eid, proxy);
            }
            this._state = sort_state(this._state);
            this._stateProvider.setValue(this._state, true);
            break;
          case 'get_log_':
            this._logProvider.setValue(event.data);
            break;
          case 'log':
            this._logProvider.setValue([...this._logProvider.value, event]);
            break;
          case 'state_update':
            const new_entity = !this._state.has(event.entity_id);
            const proxy = new Proxy(event, state_handler);
            this._state.set(event.entity_id, proxy);
            if (new_entity) this._stateProvider.setValue(this._state, true);
            this._stateProvider.setValue(this._state, true);
            break;
        }
      });

  }

  render() {
    return html`
      <leaf-router .routes=${[
        { route: "view", component: "leaf-view", connect: true },
        { route: "log", component: "leaf-log", connect: true },
        { route: "dev", component: "leaf-file-editor", connect: true, file_system: true },
        { route: "settings", component: "leaf-settings", connect: true },
        { route: "scratch", component: "leaf-scratch" },
      ]}></leaf-router>
    `
  }

}
