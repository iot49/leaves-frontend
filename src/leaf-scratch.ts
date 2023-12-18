import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

// already imported in index.ts
// ??? theme dark not available in element!
// import './index.css' assert { type: 'css' }; 


@customElement('leaf-scratch')
export class LeafScratch extends LitElement {

  static styles = css`
    :host {
      /* works; but theme attribute on leaf-page does not */
      --base-0: 0, 200, 150;
    }
    main {
      margin: 1rem;
      margin-top: 0.5rem;
    }
    .A, .B {
      display: flex;
    }
    .a {
      display: flex;
      flex: 1 1 0;
      justify-content: flex-start;
    }
    .b {
      display: flex;
      flex: 1 1 0;
      justify-content: center;
    }
    .c {
      display: flex;
      flex: 1 1 0;
      justify-content: flex-end;
    }
  `

  render() {
    return html`
      <leaf-page>
        <nav slot="nav">Scratch</nav>

        <main>
          <div class="A">
            <div class="a">Asdg</div>
            <div class="b">Bdsggdgdgs</div>
            <div class="c">Casfafsfasffasffafasf</div>
          </div>
          <div class="B">
            <div class="a">A</div>
            <div class="b">B</div>
            <div class="c">C</div>
          </div>
        </main>
      </leaf-page>
    `;
  }

}
