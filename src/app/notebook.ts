import { marked } from 'marked';
import { eventbus } from './eventbus';
import { html } from 'lit';
import { app } from '..';

export let DEFAULT_ENGINE = 'leaf';

export type Printer = (event: any) => void;

export type EditorFactory = () => CodeEditor;

export interface CodeEditor {
  code: string;
  codeModified: boolean;
  language: string;
  addEventListener(event: string, code: any, ..._);
  dispatchEvent(event: Event);
}

export function testEditorFactory(): CodeEditor {
  return new TestEditor();
};

class TestEditor implements CodeEditor {
  private _code: string = '';
  codeModified = false;
  language = 'python';
  get code() { return this._code; }
  set code(code) { this.codeModified = true;  this._code = code; }
  addEventListener(..._) {};
  dispatchEvent(_) {};
}

export class NoteBook {
  readonly version: 1 = 1;
  readonly description: string;
  readonly cells: Cell[] = [];
  public fileName = '';
  private _editorFactory: EditorFactory;
  
  constructor(editorFactory: EditorFactory, json: string = '') {
    this._editorFactory = editorFactory;
    this.description = this.description || 'leaf notebook';
    this.json = json;
  }
  
  insertCell(index = -1, prototype = { code: '' } as any): Cell {
    // insert (empty) cell at index
    // Default: after last cell
    // Example: insertCell(0) prepends new cell
    if (index == -1) index = this.cells.length;
    if (index > this.cells.length) return this.cells.at(-1);
    prototype._editor = this._editorFactory();
    prototype._editor.code = prototype.code;
    const cell = new Cell(prototype);
    // intercept Shift-Enter
    cell.editor.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
          if (e.shiftKey) {
            cell.exec();
            return e.preventDefault();
          };
          break
      }
    });
    this.cells.splice(index, 0, cell);

    
    return this.cells.at(-1);
  }

  processPrintEvent(event: any) {
    let msg: string;
    switch (event.type) {
      case 'print':
        msg = `<span class="output">${event.data}</span>`;
        break;
      case 'log':
        if (event.name !== "features.dev" && event.name !== "user_features.dev") return;
        msg = `<div class="${event.levelname}">${event.message}</div>`;
        break;
      default:
        return;
    }
    if (msg === undefined) return;
    const id = event.id;
    for (const cell of this.cells) {
      if (cell.id === id) {
        cell.output += msg;
        cell.editor.dispatchEvent(new CustomEvent('leaf-cell-changed', {
          detail: id,
          bubbles: true, composed: true
        }));
        break;   // cell id's are unique
      }
    }
  }

  get codeModified(): boolean {
    for (const cell of this.cells) if (cell.codeModified) return true;
    return false;
  }

  set codeModified(value: false) {
    for (const cell of this.cells) cell.codeModified = value;
  }

  get json() {
    return JSON.stringify(this);
  }

  set json(doc: string) {
    this.cells.splice(0, this.cells.length);
    if (doc.length === 0) {
      this.insertCell();
    } else {
      const nb = JSON.parse(doc);
      if (nb.version !== this.version) {
        app.overlay = html`<sl-dialog label="notebook.ts" open>${this.fileName}: wrong version ${nb.version} !== ${this.version}</sl-dialog>`;
      }
      for (const cell of nb.cells) this.insertCell(-1, cell);
    }

  }

  get markdown(): string {
    let s = '';
    s += `<!-- Markdown for notebook ${this.fileName}\n`;
    s += `     machine generated from source on ${(new Date().toISOString())} -->\n\n`
    for (const cell of this.cells) s += cell.toMarkdown();
    return s;
  }

}

export class Cell {
  output: string;
  hide_editor: boolean;
  hide_output: boolean;
  private _id: string;
  private _editor: CodeEditor;
  private static cellIds = 0;

  constructor(prototype = {} as any) {
    this._id = 'c' + Cell.cellIds++;
    this.output = prototype.output || '';
    this.hide_editor = prototype.hide_editor || false;
    this.hide_output = prototype.hide_output || false;
    this._editor = prototype._editor;
    this._editor.code = prototype.code || '';
    this._editor.language = this.language;
  }

  get id() { return this._id; }

  get code(): string { return this._editor.code; }
  set code(str: string) { this._editor.code = str; }

  get codeModified(): boolean { return this._editor.codeModified; }
  set codeModified(value: false) { this._editor.codeModified = value }

  get editor() { return this._editor; }

  toJSON() {
    const c = Object.fromEntries(Object.entries(this).filter(([k,_]) => 
      k !== '_editor' && k != 'id' ));
    c.code = this.code;
    return c;
  }

  toMarkdown() {
    let s = `<!--- cell ${this.id} -->\n`;
    if (this.code.length > 0) s += `\`\`\`${this.language}\n${this.code}\n\`\`\`\n`;
    if (this.output.length > 0) s += `\`\`\`\n${this.output}\n\`\`\`\n`;
    return s + '\n';
  }

  exec() {
    const code = this.code;
    this.output = '';
    this._editor.language = this.language;
    switch (this.engine) {
      case 'leaf':
        eventbus.postEvent({
          type: 'exec',
          code: code.startsWith('%%') ? '# ' + code : code,
          id: this.id
        });
        break;
      case 'javascript':
        // redirect console output
        const id = this.id;
        const cons = console as any;
        cons.default_log = console.log;
        console.log = function (...values) {
          // "fake" print event to get output to update
          window.dispatchEvent(new CustomEvent('leaf-event', {
            bubbles: true, composed: true,
            detail: { type: 'print', id: id, data: values.join(' ') }
          }));
          // also send to console
          for (const v of values) cons.default_log(v);
        }
        // eval
        try {
          const result = eval?.(code.startsWith('%%') ? '// ' + code : code);
          if (result) this.output += `<span class="output">${result}</span>`;  
        }
        // reset console to default behavior
        finally {
          console.log = (console as any).default_log;
        }
        break;
      case 'markdown':
        this.output = `<div id="markdown">${marked.parse(code.substring(code.indexOf("\n") + 1))}</div>`;
        this.hide_editor = true;
        this.hide_output = false;
        this._editor.dispatchEvent(new CustomEvent('leaf-cell-changed', {
          detail: this.id,
          bubbles: true, composed: true
        }));
        break;
      case 'mpremote':
      case 'pyodide':
        this.output = `<div class="exception">***** Not implemented: %%${this.engine}</div>`;
        break;
      default:
        this.output = `<div class="exception">***** Unknown engine: %%${this.engine}</div>`;
    }
  }

  get engine(): string {
    const aliases = {
      js: 'javascript',
      ts: 'javascript',
      typescript: 'javascript',
      md: 'markdown',
    }
    const eng = (this.code.match(/^%%([\w\d]*)/) || [null, DEFAULT_ENGINE])[1];
    return aliases[eng] || eng;
  }
  
  get language(): string {
    const languages = {
      leaf: 'python',
      mpremote: 'python',
      pyodide: 'python',
      pyscript: 'python',
    }
    const eng = this.engine;
    return languages[eng] || eng;
  }
  
}
