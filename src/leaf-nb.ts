import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('leaf-nb')
export class LeafNb extends LitElement {

  static styles = css`
    :host {
      --base-0: 218, 214, 0;
    }
  `

  render() {
    return html`
      <leaf-page>
        <nav slot="nav">Developer</nav>

        <main>
          <leaf-nb-item></leaf-nb-item>
        </main>
      </leaf-page>
    `
  }

}
