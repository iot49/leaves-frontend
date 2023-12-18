import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ContextProvider } from '@lit/context';
import { Router } from '@vaadin/router';

import { EventBus } from './app/eventbus';
import { eventbusContext } from './app/contexts';

import { type State, stateContext} from './app/contexts';
import { configContext} from './app/contexts';
import { state_handler, sort_state } from './app/state';


@customElement('leaf-main')
export class LeafMain extends LitElement {

  private _eventbus = new EventBus();
  private _eventbusProvider = new ContextProvider(this, { context: eventbusContext, initialValue: this._eventbus });

  private _state: State = new Map<string,object>();
  private _stateProvider = new ContextProvider(this, { context: stateContext, initialValue: this._state });

  private _configProvider = new ContextProvider(this, { context: configContext });

  private patch_config(cfg) {
    cfg.views[0].cards[0].entities[0].icon = 'add_circle';
    // cfg.views[0].cards[0].entities[2].unit = '%';
    // cfg.views[0].cards[0].entities[2].format = '.1f';
  }

  constructor() {
    super();
    // make state and config available globally
    (window as any).leaf = {};
    // (window as any).leaf.eventbus = this._eventbus;
    (window as any).leaf.state = this._state;


    this._eventbus.addConnectDisconnectEventListener(
      () => {
        if (this._eventbus) {
          this._eventbus.postEvent({ type: 'get_config' })
          this._eventbus.postEvent({ type: 'get_state' })
        }
        this._eventbusProvider.setValue(this._eventbus, true);
      });

    this._eventbus.addOnEventListener(
      (event: any) => {
        switch (event.type) { 
          case 'get_config_':
            this.patch_config(event.data);
            this._configProvider.setValue(event.data, true);
            (window as any).leaf.config = event.data;
            break;
          case 'get_state_':
            for (const [eid, value] of Object.entries(event.data)) {
              const proxy = new Proxy({ entity_id: eid, value: value }, state_handler);
              this._state.set(eid, proxy );
            }       
            this._state = sort_state(this._state);
            this._stateProvider.setValue(this._state, true);
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

  firstUpdated(prop) {
    super.firstUpdated(prop);
    const router = new Router(this.shadowRoot.querySelector('#outlet'));
    router.setRoutes([
      { path: '/view/:id', component: 'leaf-view' },
      { path: '/connect', component: 'leaf-connect' },
      { path: '/log', component: 'leaf-log' },
      { path: '/settings', component: 'leaf-settings' },
      { path: '/editor', component: 'leaf-editor' },
      { path: '/scratch', component: 'leaf-scratch' },
      { path: '(.*)', redirect: '/view/0' },
    ]);
    // Router.go('/editor');
    // Router.go('/scratch');
    Router.go(this._eventbus.connected ? '/' : '/connect');
  }

  render() {
    return html`
      <main>
        <div id="outlet"></div>
      </main>
    `
  }

}
