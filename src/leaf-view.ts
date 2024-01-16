import { html, LitElement, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { choose } from 'lit/directives/choose.js';

import { type Config, configContext } from './app/contexts';
import { go } from './app/app';
import { shared_css } from './assets/css/shared_styles';


@customElement('leaf-view')
export class LeafView extends LitElement {

  @consume({ context: configContext, subscribe: true })
  @property({ attribute: false })
  private config: Config;

  static styles = [
    shared_css,
    css`
      * {
        text-decoration: none;
      }
      nav {
        display: flex;
      }
      nav > div {
        margin-right: 1rem;
      }
      .selected {
        border-bottom: 2px solid var(--sl-color-neutral-0);
      }
      .spinner {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
      }
      sl-spinner {
        font-size: 50px; 
        --track-width: 4px;
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
    let views, cards;
    try {
      views = this.config.views;
      cards = views[this.view_id].cards;  
    }
    catch {
      return html`
        <leaf-page>
          <nav slot="nav">Connecting</nav>
          <div class="spinner">
            <sl-spinner></sl-spinner>
          </div>
        </leaf-page>
      `
    }

    return html`
      <leaf-page mobile>
        <nav slot="nav">
          ${views.map((view, index) =>
            html`
              <div 
                @click=${() => go(`view/${index}`)} 
                class="${index == this.view_id ? 'selected' : ''}">
                <sl-icon name="${view.icon}"></sl-icon>
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
