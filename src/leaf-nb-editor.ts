import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { shared_css } from './assets/css/shared_styles';

import { Cell, CodeEditor, NoteBook } from './app/notebook';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LeafEditor } from '.';
import { markdown_css } from './assets/css/markdown';
import { output_css } from './assets/css/output';
import { delete_cell, exec_cell, insert_above, insert_below, move_down, move_up } from './assets/nb-icons';


// python asyc exec: https://bugs.python.org/issue34616
// python 3.8: https://docs.python.org/3/whatsnew/3.8.html, search for "compile"
/*
The compile() built-in has been improved to accept the ast.PyCF_ALLOW_TOP_LEVEL_AWAIT flag. 
With this new flag passed, compile() will allow top-level await, async for and async with 
constructs that are usually considered invalid syntax. Asynchronous code object marked with 
the CO_COROUTINE flag may then be returned. (Contributed by Matthias Bussonnier in bpo-34616)
*/

@customElement('leaf-nb-editor')
export class LeafNbEditor extends LitElement implements CodeEditor {

  static styles = [
    shared_css,
    css`
      :host {
        --base-0: 218, 214, 0;
      }
      main {
        margin: 10px;
      }

      .cell {
        margin-bottom: 35px;
      }

      .hide {
        display: none;
      }

      .code {
        display: flex;
        flex: auto;
        position: relative;
        margin-bottom: 12px;
      }

      .out {
        display: flex;
        flex: auto;
        min-height: 12px;
      }

      .vbar {
        border: 2px solid var(--sl-color-emerald-500);
        background-color: var(--sl-color-emerald-500);
        width: 7px;
        min-height: 12px;
        margin-right: 20px;
        border-radius: 3px;
        border-width: 2px;
        box-sizing: content-box;
      }
      .code .vbar {
        border-color: var(--sl-color-primary-500);
        background-color: var(--sl-color-primary-500);
      }
      .code .outline, .out .outline {
        background-color: var(--sl-color-neutral-0);
      }

      .editor {
        width: 100%;
        overflow-x: auto;
      }
      .editor:focus-within {
        border: 1px solid var(--sl-color-primary-500);
      }

      .result {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
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
      .tool {
        margin-left: 8px;
        width: 1rem;
        height: 1rem;
        padding-left: 3px;
        color: #616161;
      }
      .tool:hover {
        background-color: var(--sl-color-neutral-200);
      }
      .tool-disabled {
        color: var(--sl-color-neutral-200);
      }
    `,
    output_css,
    markdown_css,
  ];

  @state()
  public notebook = new NoteBook(() => new LeafEditor());

  get code() { return this.notebook.json; }
  set code(json: string) { this.notebook.json = json; }

  get language() { return '' };
  set language(_: string) {};

  get codeModified(): boolean { return this.notebook.codeModified; }
  set codeModified(value: false) { this.notebook.codeModified = value; }

  public async save(handle: FileSystemHandle) {
    const nb = this.notebook;
    if (!nb.codeModified) return;
    const writable = await (handle as any).createWritable();
    await writable.write(this.notebook.json);
    await writable.close();
    this.codeModified = false;
  }

  // js insanity
  private message(event: CustomEvent) { this.notebook.processPrintEvent(event.detail); }
  private messageCb = this.message.bind(this);

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('leaf-cell-changed', () => this.requestUpdate());
    window.addEventListener('leaf-event', this.messageCb);
  }

  disconnectedCallback(): void {
    window.removeEventListener('leaf-connection', this.messageCb);
  }

  toolsTemplate(cellIndex: number) {
    const cells = this.notebook.cells;
    return html`
      <span class="tool" @click=${() => cells[cellIndex].exec()}>${exec_cell}</span>              
      <span class="tool ${cellIndex > 0 ? '' : 'tool-disabled'}"
          @click=${() => {
            if (cellIndex > 0) [cells[cellIndex - 1], cells[cellIndex]] = [cells[cellIndex], cells[cellIndex - 1]];
            this.requestUpdate();
          }}>${move_up}</span>              
      <span class="tool ${cellIndex < cells.length - 1 ? '' : 'tool-disabled'}"
          @click=${() => {
            if (cellIndex < cells.length - 1) [cells[cellIndex + 1], cells[cellIndex]] = [cells[cellIndex], cells[cellIndex + 1]];
            this.requestUpdate();
          }}>${move_down}</span>              
      <span class="tool" @click=${() => {
        this.notebook.insertCell(cellIndex);
        this.requestUpdate();
      }}>${insert_above}</span>              
      <span class="tool" @click=${() => {
        this.notebook.insertCell(cellIndex+1);
        this.requestUpdate();
      }}>${insert_below}</span>              
      <span class="tool" @click=${() => {
        cells.splice(cellIndex, 1);
        this.requestUpdate();
      }}>${delete_cell}</span>              
    `;
  }

  cellTemplate(cell: Cell, index: number) {
    return html`
      <div class="cell ${cell.id}}">
        <div class="code">
          <div class="vbar ${cell.hide_editor ? 'outline' : ''}"
            @click=${() => { cell.hide_editor = !cell.hide_editor;  this.requestUpdate(); }}></div>
          <div class="editor ${cell.hide_editor ? 'hide' : ''}">${cell.editor}</div>
          <div class="tools ${cell.hide_editor ? 'hide' : ''}">${this.toolsTemplate(index)}</div>
        </div>
        <div class="out">
          <div class="vbar ${cell.hide_output ? 'outline' : ''}"
              @click=${() => { cell.hide_output = !cell.hide_output;  this.requestUpdate();}}></div>
          <div class="result ${cell.hide_output ? 'hide' : ''}">${unsafeHTML(cell.output)}</div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <main>
        ${this.notebook.cells.map((cell, index) => 
          this.cellTemplate(cell, index))}
      </main>
    `;
  } 

}

