import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';


@customElement('leaf-tabbed-pane')
export class LeafTabbedPane extends LitElement {

  static styles = css`
    #pane {
      display: flex;
      flex-direction: column;
    }

    #tabs {
      background-color: lightgray;
    }

    #tabs a {
      background-color: gray;
      float: left;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-right: solid white 1px;
    }

    #tabs .selected {
      background-color: white;
    }

    .hidden {
      display: none;
    }
  `

  @property({ type: Number, reflect: true })
  selected_index: number = 0;

  // can't get this to work with a slot
  @property({ attribute: false })
  private tabs;

  // TODO: accept slots?
  // @queryAssignedElements()
  // private my_slot_elements: Array<HTMLElement>;
  render() {
    return html`
      <div id="pane">
        <div id="tabs">
          ${this.tabs.map((e, i) =>
            html`<a 
                  @click=${() => this.selected_index = i}
                  class=${i === this.selected_index ? 'selected' : ''}>${e.name}
              </a>`
          )}
        </div>
        <div id="content">
          ${this.tabs.map((e, i) =>
            html`<div class=${i !== this.selected_index ? 'hidden' : ''}>${e.element}</div>`
          )}
        </div>
      </div>
    `;
  }

}
