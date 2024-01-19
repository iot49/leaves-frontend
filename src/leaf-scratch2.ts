import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { app } from './leaf-main';


@customElement('leaf-scratch2')
export class LeafScratch2 extends LitElement {

  connectedCallback(): void {
    super.connectedCallback();
  }

  render() {
    return html`
      <leaf-page>
        <div slot="nav">Overlay</div>
        scratch ...
        <sl-button @click=${() => app.overlay = html`<div>XXXX</div>`}>set div</sl-button>

        <sl-button @click=${() => app.overlay =  html`
            <sl-dialog label="Dialog" no-header open>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              <sl-button slot="footer" variant="primary" @click=${() => app.overlay = html``}>Close</sl-button>
            </sl-dialog>`
        }>set dialog</sl-button>

        <sl-button @click=${() => app.overlay = html`
          <div>
            <sl-alert variant="success" open closable>
              <sl-icon slot="icon" name="check2-circle"></sl-icon>
              <strong>Your changes have been saved</strong><br />
              You can safely exit the app now.
            </sl-alert>
          </div>`
        }>set alert</sl-button>

      </leaf-page>
    `;
  }

}