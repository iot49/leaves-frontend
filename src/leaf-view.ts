import { html, LitElement, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { choose } from 'lit/directives/choose.js';

import { type Config, configContext } from './app/contexts';
import { go, location } from './app/app';


@customElement('leaf-view')
export class LeafView extends LitElement {

  @consume({ context: configContext, subscribe: true })
  @property({ attribute: false })
  private config: Config;

  static styles = [
    css`
      * {
        text-decoration: none;
      }
      nav {
        display: flex;
      }
      nav > div {
        color: green;
        margin-right: 1rem;
      }
      nav > a:hover {
        border-bottom: 2px solid yellow;
      }
      .selected {
        border-bottom: 2px solid white;
      }
    `
  ];

  @state()
  private view_id = 0;

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('go', (ev: CustomEvent) => {
      const location = ev.detail.location;
      const n = Number(location.substring(location.lastIndexOf('/') + 1));
      this.view_id = n ? n : 0;
    });
  }  
    
  render() {
    const views = this.config.views;
    const cards = views[this.view_id].cards;

    return html`
      <leaf-page mobile theme="view-theme">
        <nav slot="nav">
          ${views.map((view, index) =>
            html`
              <div 
                @click=${() => go(`view/${index}`)} 
                class="${index == this.view_id ? 'selected' : ''}">
                <kor-icon color="white" icon="${view.icon}"></kor-icon>
              </div>`
          )}
        </nav>
        
        ${cards.map((card) =>
          choose(card.type, [
            ['entities', () => html`<leaf-entities .card=${card}></leaf-entities>`],
          ],
          () => html`<h1>Unknown card type: ${card.type}</h1>`)
        )}
      </leaf-page>`;
  }

}
