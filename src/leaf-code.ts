import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('leaf-code')
export class LeafCode extends LitElement {

  static styles = css`
    code {
      display: block;
      padding: 5px;
      white-space: pre-wrap;
      word-break: break-all;
      word-wrap: break-word;

      font-size: 13px;
      font-family: 'menlo', consolas, 'DejaVu Sans Mono', monospace;
      font-family: 'menlo';
      line-height: 1.3077;

      overflow-x: auto;
      overflow-y: auto;
    }
  `

  render() {
    return html`
      <code><slot></slot></code>
    `;
  }

}
