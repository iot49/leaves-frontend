import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { eventbus } from './app/app';
import { LeafEditor, LeafPopup } from '.';


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

  static styles = css`
    // TODO: import from index.css
    :host {
      --base-0: 218, 214, 0;
    }
    main {
      margin: 10px;
    }
    .code {
      display: block;
      padding: 5px;
      white-space: pre;
     
      font-size: 13px;
      font-family: 'menlo', consolas, 'DejaVu Sans Mono', monospace;
      font-family: 'menlo';
      line-height: 1.3077;

      overflow-x: auto;
      overflow-y: auto;
    }
    .exception {
      color: red;
    }
    .DEBUG {
      color: blue;
    }
    .INFO, .NOTSET {
      color: green;
    }
    .WARNING {
      color: purple;
    }
    .ERROR {
      color: red;
    }
    .CRITICAL {
      color: darkred;
    }
  `

  @state()
  private cells = [];

  @query('.context_menu')
  context_menu;

  @query('leaf-popup')
  popup: LeafPopup;

  private static next_cell_id = 1;
  private active_cell = -1;

  constructor(initial_doc = "") {
    super();
    this.load_nb(initial_doc);
  }

  public async save(handle: FileSystemHandle) {
    const writable = await (handle as any).createWritable();
    await writable.write(this.getDoc());
    await writable.close();
    // console.log('saved', handle.name);
  }

  public getDoc() {
    const nb = {
      description: 'leaf notebook',
      version: 1,
      cells: this.cells.map(function (c) { return { code: c.editor.getDoc(), output: c.output } } )
    }
    return JSON.stringify(nb, null, 2);
  }

  public setDoc(doc: string) {
    const editor: LeafEditor = this.renderRoot.querySelector('#editor');
    editor.setDoc(doc);
  }

  private load_nb(doc: string) {
    if (doc.length === 0) {
      this.add_cell();
    } else {
      const nb = JSON.parse(doc);
      if (nb.version !== 1) console.log('.nb file, wrong version', doc);
      for (const c of nb.cells) this.add_cell(c.code, c.output);
    }
  }

  private add_cell(code="", output="", index=-1) {
    const cell = { id: 'c' + LeafNbEditor.next_cell_id, editor: new LeafEditor(code, 'py'), output: output };
    LeafNbEditor.next_cell_id += 1;
    if (index < 0) {
      this.cells.push(cell);
      index = this.cells.length - 1;
    } else {
      this.cells.splice(index, 0, cell);
    }
    // schedule an update
    this.cells = [...this.cells];

    // intercept Shift-Enter
    cell.editor.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
          if (e.shiftKey) {
            this.exec_cmd(index);
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
        msg = event.data;
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

  updated(): void {
    this.renderRoot.querySelectorAll(".cell").forEach((cell: HTMLElement) => {
      cell.addEventListener("contextmenu", (event: PointerEvent) => {
        this.context_menu.show(event);
        return event.preventDefault();
      })
    })
  }

  exec_cmd(index: number) {
    this.active_cell = index;
    const cell = this.cells[index];
    cell.output = "";
    eventbus.postEvent({
      type: 'exec',
      code: cell.editor.getDoc(),
      id: cell.id
    });
    if (index+1 === this.cells.length) this.add_cell();
    cell.editor.focus();
  }

  async context_cmd(event) {
    this.context_menu.hide();
    const cell_el = this.popup.target.parentElement;
    const index = [...cell_el.parentElement.children].indexOf(cell_el);
    const cell = this.cells[index];
    switch (event.target.id) {
      case 'run':
        this.exec_cmd(index);
        return
      case 'clear':
        cell.output = "";
        break
      case 'append':
        this.add_cell("", "", index+1);
        break
      case 'delete':
        this.cells.splice(index, 1);
        break
    }
    // schedule update
    this.cells = [...this.cells];
  }

  render() {
    return html`
      <main>
        ${ this.cells.map((cell) => 
          html`
            <div id=${cell.id} class="cell">
              ${cell.editor}

              <div class="code">${unsafeHTML(cell.output)}</div>
            </div>`
        )}

        <leaf-popup class="context_menu" @click=${this.context_cmd}>
          <kor-menu-item id="run" icon="arrow_right" label="Run"></kor-menu-item>
          <kor-menu-item id="clear" icon="cancel_presentation" label="Clear Output"></kor-menu-item>
          <kor-menu-item id="append" icon="post_add" label="Insert Cell"></kor-menu-item>
          <kor-menu-item id="delete" icon="delete" label="Delete"></kor-menu-item>
        </leaf-popup>
      </main>
    `
  }

}


