import { html, css, LitElement } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { marked } from 'marked';

import { eventbus } from './app/app';
import { LeafEditor } from '.';
import { exec_cell, move_up, move_down, insert_above, insert_below, delete_cell } from './assets/nb-icons';
import { shared_css } from './assets/css/shared_styles';


// python asyc exec: https://bugs.python.org/issue34616
// python 3.8: https://docs.python.org/3/whatsnew/3.8.html, search for "compile"
/*
The compile() built-in has been improved to accept the ast.PyCF_ALLOW_TOP_LEVEL_AWAIT flag. 
With this new flag passed, compile() will allow top-level await, async for and async with 
constructs that are usually considered invalid syntax. Asynchronous code object marked with 
the CO_COROUTINE flag may then be returned. (Contributed by Matthias Bussonnier in bpo-34616)
*/

@customElement('leaf-nb-editor')
export class LeafNbEditor extends LitElement {

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
        margin-bottom: 15px;
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
  ];

  private _file_name: string;



  @state()
  private cells: { 
    id: string, 
    code: string, 
    output: string, 
    hide_editor: boolean, 
    hide_result: boolean, 
    editor?: LeafEditor,
   }[] = [];

  @query('.context_menu')
  context_menu;

  private static next_cell_id = 0;
  private active_cell = -1;

  constructor(file_name: string, initial_doc = "") {
    super();
    this._file_name = file_name;
    this.load_nb(initial_doc);
  }

  public async save(handle: FileSystemHandle) {
    let changed = false;
    for (const cell of this.cells) {
      changed ||= cell.editor.changed;
      cell.editor.changed = false;
    }
    if (!changed) return;
    const writable = await (handle as any).createWritable();
    await writable.write(this.getDoc());
    await writable.close();
  }

  public getDoc() {
    const nb = {
      description: 'leaf notebook',
      version: 1,
      cells: this.cells.map(function (cell) {
        // update code and return all keys except 'id' and 'editor'
        cell.code = cell.editor.getDoc();
        let { id, editor, ...rest } = cell;
        return rest;
      })
    }
    return JSON.stringify(nb, null, 2);
  }

  private load_nb(doc: string) {
    if (doc.length === 0) {
      this.add_cell();
    } else {
      const nb = JSON.parse(doc);
      if (nb.version !== 1) console.log(`${this._file_name}: wrong version`, doc);
      for (const cell of nb.cells) this.add_cell(-1, cell);
    }
  }

  private add_cell(index = -1, cell = {} as any) {
    LeafNbEditor.next_cell_id += 1;
    cell.id = 'c' + LeafNbEditor.next_cell_id;
    cell.code! != "";
    cell.output! != "";
    cell.editor = new LeafEditor(cell.code, 'py');
    cell.hide_editor ||= false;
    cell.hide_result ||= false;
    if (index < 0) {
      // append new cell to cells array
      this.cells.push(cell);
      index = this.cells.length - 1;
    } else {
      // insert after index
      this.cells.splice(index, 0, cell);
    }
    // schedule an update
    this.cells = [...this.cells];

    // intercept Shift-Enter
    cell.editor.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
          if (e.shiftKey) {
            this.exec_cell(index);
            return e.preventDefault();
          };
          break
      }
    });

  }

  // js insanity
  private messageCb = this.message.bind(this);

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('event-bus-message', this.messageCb);
  }

  disconnectedCallback(): void {
    window.removeEventListener('event-bus-message', this.messageCb);
  }

  message(ev: CustomEvent) {
    if (this.active_cell < 0) return;
    const event = ev.detail;
    let msg;
    switch (event.type) {
      case 'print':
        msg = `<span class="output">${event.data}</span>`;
        break;
      case 'log':
        if (event.name === "features.dev" || event.name === "user_features.dev") {
          msg = `<div class="${event.levelname}">${event.message}</div>`;
        }
        break;
    }
    if (msg) {
      this.cells[this.active_cell].output += msg;
      // schedule an update
      this.cells = [...this.cells];
    }
  }

  exec_cell(index: number) {
    this.active_cell = index;
    const cell = this.cells[index];
    const code = cell.editor.getDoc();
    const cell_id = cell.id;
    const language = (code.match(/^%%([\w\d]*)/) || [code, 'micropython'])[1];
    cell.output = "";
    cell.editor.switchLanguage(language);
    switch (language) {
      case 'micropython':
      case 'mp':
        eventbus.postEvent({
          type: 'exec',
          code: code.startsWith('%%') ? '# ' + code : code,
          id: cell_id
        });
        break;
      case 'javascript':
      case 'js':
        // redirect console output
        const cons = console as any;
        cons.default_log = console.log;
        console.log = function (...values) {
          window.dispatchEvent(new CustomEvent('event-bus-message', {
            bubbles: true, composed: true,
            detail: { type: 'print', data: values.join(' ') }
          }));
        }
        // eval
        try {
          const result = eval?.(code.startsWith('%%') ? '// ' + code : code);
          if (result) cell.output += `<span class="output">${result}</span>`;  
        }
        // reset console to default behavior
        finally {
          console.log = (console as any).default_log;
        }
        break;
      case 'markdown':
      case 'md':
        cell.output = marked.parse(code.substring(code.indexOf("\n") + 1)) as string;
        cell.hide_editor = true;
        break;
      default:
        cell.output = `<div class="exception">***** Unknown language: %%${language}</div>`;
    }
    this.cells = [...this.cells];
    // add empty cell if this one is the last one of the notebook
    if (index + 1 === this.cells.length) this.add_cell();
    this.cells[this.active_cell+1].editor.setFocus();
  }

  render() {
    const cells = this.cells;
    return html`
      <main>
        ${cells.map((cell, i) =>
        html`
            <div class="cell">
              <leaf-nb-cell id=${cell.id} .cell=${cell} .output=${cell.output}>
                <div id="tools">
                  <span class="tool" 
                      @click=${() => this.exec_cell(i)}>
                      ${exec_cell}
                  </span>              
                  <span class="tool ${i > 0 ? '' : 'tool-disabled'}"
                      @click=${() => {
                        if (i > 0) {
                          [cells[i - 1], cells[i]] = [cells[i], cells[i - 1]]
                        }
                        this.cells = [...this.cells];
                      }}>
                      ${move_up}
                  </span>              
                  <span class="tool ${i < cells.length - 1 ? '' : 'tool-disabled'}"
                      @click=${() => {
                        if (i < cells.length - 1) {
                          [cells[i + 1], cells[i]] = [cells[i], cells[i + 1]]
                        }
                        this.cells = [...this.cells];
                      }}>
                      ${move_down}
                  </span>              
                  <span class="tool" @click=${() => this.add_cell(i)}>${insert_above}</span>              
                  <span class="tool" @click=${() => this.add_cell(i + 1)}>${insert_below}</span>              
                  <span class="tool" @click=${() => {
                    this.cells.splice(i, 1);
                    this.cells = [...this.cells];
                  }}>${delete_cell}</span>              
                </div>
              </leaf-nb-cell>
            </div>`
      )}
      </main>
    `
  }

}

