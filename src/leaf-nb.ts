import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('leaf-nb')
export class LeafNb extends LitElement {

  private left_width = 300;

  static styles = css`
    :host {
      --base-0: 218, 214, 0;
    }
    main {
      display: flex;
    }
    #left {
      width: 300px;
      overflow: hidden;
    }
    #splitter {
      width: 5px;
      background-color: rgb(var(--base-4));
    }
    #splitter:hover {
      cursor: col-resize;
    }
  `

  protected async firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    // splitter dragging
    const left_el = this.renderRoot.querySelector('#left') as any;
    const splitter_el = this.renderRoot.querySelector('#splitter');

    let start_x = 0;

    const move_listener = (event: MouseEvent) => {
      this.left_width += event.clientX - start_x;
      left_el.style.width = this.left_width + 'px';
      start_x = event.clientX;
    };

    const up_listener = ()=> {
      document.removeEventListener('mousemove', move_listener);
      document.removeEventListener('mouseup', up_listener);
    };

    splitter_el.addEventListener("mousedown", (event: MouseEvent) => {
      document.addEventListener('mousemove', move_listener);
      document.addEventListener('mouseup', up_listener);
      start_x = event.clientX;
    });
  }

  render() {
    return html`
      <leaf-page>
        <nav slot="nav">Developer</nav>
        <leaf-nb-item></leaf-nb-item>     
        <main>
          <leaf-file-viewer id="left"></leaf-file-viewer>
          <div id="splitter"></div>
          <leaf-nb-item id="right"></leaf-nb-item>     
        </main>
      </leaf-page>
    `
  }

}
