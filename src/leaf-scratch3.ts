import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement } from 'lit/decorators.js';

// https://stackoverflow.com/questions/49678342/css-how-to-target-slotted-siblings-in-shadow-dom-root

@customElement('leaf-scratch3')
export class LeafScratch3 extends LitElement {    

  static styles = css``;

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    const item = this.renderRoot.querySelector('sl-tree-item');
    item.addEventListener('sl-expand', (e) => console.log('expand', e, this));
    item.addEventListener('sl-collapse', (e) => console.log('collapse', e, this));
    item.addEventListener('sl-lazy-load', () => {
      console.log('lazy', item);

      item.lazy = false;
    });
  }

  render() {
    return html`
      <leaf-page>
        <nav slot="nav">Scratch 3</nav>

        <sl-tree>
          <sl-tree-item lazy>ROOT</sl-tree-item>
          <sl-tree-item>Item 2</sl-tree-item>
          <sl-tree-item>Item 3</sl-tree-item>
        </sl-tree>
      </leaf-page>
    `;
  }

}
