import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { markdown_css } from './assets/css/markdown'
import { output_css } from './assets/css/output'
import { shared_css } from './assets/css/shared_styles';


@customElement('leaf-nb-cell')
export class LeafNbCell extends LitElement {

  static styles = [
    shared_css,
    css`
      .editor {
        display: flex;
        flex: 1;
        margin-bottom: 5px;
      }
      .edit {
        display: flex;
        flex: auto;
        position: relative;
      }
      .editor-component {
        width: 100%;
        border: 1px solid var(--sl-color-neutral-200);
      }
      .editor-component:focus-within {
        border: 1px solid var(--sl-color-primary-500);
      }
      .result {
        display: flex;
        min-height: 12px;
      }
      .hide {
        display: none;
      }
      .vertical {
        border: 2px solid var(--sl-color-emerald-500);
        background-color: var(--sl-color-emerald-500);
        width: 7px;
        min-height: 12px;
        margin-right: 20px;
        border-radius: 3px;
      }
      .editor .vertical {
        border-color: var(--sl-color-primary-500);
        background-color: var(--sl-color-primary-500);
      }
      .outline, .editor .outline {
        background-color: var(--sl-color-neutral-0);
      }
      .tools {
        position: absolute;
        top: 2px;
        right: 4px;
        visibility: hidden;
      }
      .cell:hover .tools {
        visibility: visible;
      }
    `,
    output_css,
    markdown_css,
  ];

  @property({ reflect: true })
  cell: any;

  @property()
  output: string;

  @state()
  hide_editor;

  @state()
  hide_result;

  get code() {
    return this.cell.editor.getDoc();
  }

  render() {
    const cell = this.cell;
    this.hide_editor = cell.hide_editor;
    this.hide_result = cell.hide_result;
    // console.log("nb-cell render", cell);
    return html`
      <div id=${cell.id} class="cell">
        <div class="editor">
          <div class="vertical ${this.hide_editor ? 'outline' : ''}" 
            @click=${() => this.hide_editor = cell.hide_editor = !cell.hide_editor}></div>
          <div class="edit ${this.hide_editor ? 'hide' : ''}">
            <div class="editor-component">${cell.editor}</div>
            <div class="tools"><slot></slot></div>
          </div>
        </div>
        <div class="result">
          <div class="vertical ${this.hide_result ? 'outline' : ''}" 
            @click=${() => this.hide_result = cell.hide_result = !cell.hide_result }></div>
          <div class="${this.hide_result ? 'hide' : ''}">${unsafeHTML(cell.output)}</div>
        </div>
      </div>
    `
  }

  toggle_hide(el: HTMLElement) {
    if (el.style.display === "none") {
      el.style.display = "block";
    } else {
      el.style.display = "block";
    }

  }

}


