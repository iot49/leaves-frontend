import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';


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
      padding: 0;
      margin: 0;
    }
    .hidden {
      display: none;
    }
  `

  @property({ attribute: false, reflect: true })
  target: HTMLElement;

  public show(event: MouseEvent) {
    this.target = event.target as HTMLElement;
    // show popup
    const cm: HTMLElement = this.renderRoot.querySelector('.context-menu');
    cm.style.position = 'absolute';
    cm.style.top = event.clientY + 'px';
    cm.style.left = event.clientX + 'px';
    cm.classList.remove("hidden");
  }

  public hide() {
    const cm: HTMLElement = this.renderRoot.querySelector('.context-menu');
    cm.classList.add("hidden");
  }

  render() {
    return html`<div class="context-menu hidden"><slot></slot></div>`
  }

}
