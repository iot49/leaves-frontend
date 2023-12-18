import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { choose } from 'lit/directives/choose.js';

import { type Config, configContext } from './app/contexts';


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
      nav > a {
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

  private get view_id(): number {
    const path = window.location.pathname;
    const n = Number(path.substring(path.lastIndexOf('/') + 1));
    return n ? n : 0;
  }

  render() {
    if (!this.config) {
      return html`<kor-spinner label="Loading configuration ..."></kor-spinner>`
    }

    const views = this.config.views;
    const view_id = this.view_id >= views.length ? 0 : this.view_id;
    const cards = views[view_id].cards;

    return html`
      <leaf-page mobile theme="view-theme">
        <nav slot="nav">
          ${views.map((view, index) =>
            html`<a href="/view/${index}" class="${index == view_id ? 'selected' : ''}"><kor-icon color="white" icon="${view.icon}"></kor-icon></a>`
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
