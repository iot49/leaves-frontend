import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('leaf-popup')
export class LeafPopup extends LitElement {

  static styles = css`
    .context-menu {
      display: block;
      padding: 0.2rem 0.8rem;
      border-radius: var(--border-radius);
      font-size: 75%;
      background-color: rgb(var(--base-4));
      box-shadow: var(--shadow-1);
      z-index: 1000;        
    }
    .hidden {
      display: none;
    }

  `

  connectedCallback() {
    super.connectedCallback();
    console.log('connected', this, this.parentElement);

    // right click events
    this.parentElement.addEventListener("contextmenu", (event: PointerEvent) => {
      // show context menu
      const cm: HTMLElement = this.renderRoot.querySelector('.context-menu');
      cm.style.position = 'absolute';
      cm.style.top = event.clientY + 'px';
      cm.style.left = event.clientX + 'px';      
      cm.classList.remove("hidden");

      document.addEventListener("click", () => {
        // hide context menu
        cm.classList.add("hidden");
      }, { once: true });     

      return event.preventDefault();
    });
  }

  render() {
    console.log('render');
    return html`
      <div class="context-menu hidden">
        <slot></slot>
      </div>
    `
  }

}
