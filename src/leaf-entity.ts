import { html, css, PropertyValueMap, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import 'python-format-js';

import { type State, stateContext } from './app/contexts';
import { shared_css } from './assets/css/shared_styles';


@customElement('leaf-entity')
export class LeafEntity extends LitElement {
    
    @property() 
    entity_id = "";

    @property({attribute: false}) 
    spec: any;

    @consume({ context: stateContext, subscribe: true })
    @property({ attribute: false })
    private state: State;

    private value = undefined;

  
    static styles = [
      shared_css,
      css`
        :host {
          display: flex;
        }
        .icon {
          font-size: 24px;
        }
        .name {
          width: 10rem;
          margin-left: 1rem;
        }
        .value {
          display: flex;
          width: 4rem;
          margin-left: 1rem;
          justify-content: right;
        }
        .unit {
          width: 2rem;
          margin-left: 0.3rem;
        }
      `
    ]

    protected shouldUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): boolean {
      const entity: any = this.state.get(this.entity_id);
      return entity && entity.value != this.value;
    }

    render() {
      // console.log('render leaf-entity', this.entity_id);
      const proxy_handler = {
        get(target, prop, _) {
          const a = target.spec[prop];
          if (a) return a;
          return target.state[prop];
        }
      }

      const state: any = this.state.get(this.entity_id);
      this.value = state.value;
      const entity: any = new Proxy({ spec: this.spec, state: state }, proxy_handler);

      return html`
        <sl-icon class="icon" name=${entity.icon}></sl-icon>
        <span class="name">${entity.name}</span>
        <span class="value">${this.format(this.value, entity.format)}</span>
        <span class="unit">${entity.unit}</span>
      `;
    }

    format(value, fmt: string = undefined) {
      if (fmt) {
        if (!fmt.startsWith(':')) fmt = ':' + fmt;
      } else {
        switch (typeof(value)) {
          case 'string': 
            return value;
          case 'number': 
            if (Number.isInteger(value)) return value;
            fmt = ':.2f';  break;
          case 'boolean': 
            fmt = value ? 'on' : 'off';  break;
          default: 
            return JSON.stringify(value);
        }  
      }
      return (`{${fmt}}` as any).format(value);
    }

}
