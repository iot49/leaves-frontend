import { html, css, LitElement, PropertyValueMap } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';


@customElement('leaf-split')
export class LeafSplit extends LitElement {

  // width of left component
  @property({ type: Number, reflect: true })
  left_width = 300;

  @query('#container')
  container;

  static styles = css`
    #container {
      display: grid;
      column-gap: 0;
      height: 100vh;
    }
    .splitter {
      background-color: rgb(var(--base-4));
    }
    .splitter:hover {
      cursor: col-resize;
    }
  `

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    this.renderRoot.querySelector('.splitter').addEventListener("mousedown", () => {
      this.container.addEventListener('mousemove', move_listener);
      this.container.addEventListener('mouseup', up_listener);
    });
    const move_listener = (event: MouseEvent) => {
      this.left_width = event.clientX;
    }
    const up_listener = () => {
      this.container.removeEventListener('mousemove', move_listener);
      this.container.removeEventListener('mouseup', up_listener);
    };
  }

  render() {
    return html`
      <div id="container" style="grid-template-columns: ${this.left_width}px 5px auto">
        <div class="left"><slot name="left"></slot></div>
        <div class="splitter"></div>
        <div class="right"><slot name="right"></slot></div>
      </div>
    `
  }

}
