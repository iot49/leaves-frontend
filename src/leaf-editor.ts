import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement } from 'lit/decorators.js';
import { shared_css } from './assets/css/shared_styles';

import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";

import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from '@codemirror/language';

import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';

import { CodeEditor } from './app/notebook';


// yaml: https://github.com/codemirror/dev/issues/306
// sizing: https://discuss.codemirror.net/t/fill-a-div-with-the-editor/5248/5


@customElement('leaf-editor')
export class LeafEditor extends LitElement implements CodeEditor {

  static styles = [ 
    shared_css,
    css`
      #editor {
        background-color: var(--sl-color-neutral-50);
        font-size: var(--sl-font-size-x-small);
      }

      .cm-editor {
        outline: none !important;
      }
  `];

  // @property({ reflect: true })
  languageProperty = "python";

  private _state: EditorState;
  private _view: EditorView;
  private _language_comp = new Compartment();
  public codeModified = false;

  constructor() {
    super();
    this.createState();
  }

  private createState(doc = "") {
    let updateExtension = EditorView.updateListener.of(update => {
      if (update.docChanged) this.codeModified = true;
    });
    this._state = EditorState.create({
      doc: doc,
      extensions: [
        basicSetup, 
        updateExtension,
        // keymap.of([ { key: 'Tab', run: acceptCompletion } ]), 
        keymap.of([ indentWithTab ]),
        this._language_comp.of([ python() ]),
        indentUnit.of("    "), 
      ],
    });
  }

  get code() { return this._view ? this._view.state.doc.toString() : this._state.doc.toString(); }

  set code(code) { 
    if (this._view) {
      this._view.dispatch({changes: {
        from: 0,
        to: this._view.state.doc.length,
        insert: code
      }});    
    } else {
      // view not yet created, I don't know how to modify the doc in the state
      // so I recreate the entire state
      this.createState(code);
    }
    this.codeModified = false;
  }

  public get language() { return this.languageProperty; }

  public set language(lang: string) {
    if (this.languageProperty == lang) return;
    if (!this._view) return;
    this.languageProperty = lang;
    const languages = {
      python: python,
      py: python,
      javascript: javascript,
      js: javascript,
      typescript: javascript,
      ts: javascript,
      markdown: markdown,
      md: markdown,
      json: json,
    }
    this._view.dispatch({
      effects: this._language_comp.reconfigure(lang in languages ? languages[lang]() : [])
    });
  }

  public async save(handle: FileSystemHandle) {
    if (!this.codeModified) return;
    this.codeModified = false;
    const writable = await (handle as any).createWritable();
    await writable.write(this.code);
    await writable.close();
  }

  public setFocus() {
    if (this._view) this._view.focus();
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    this._view = new EditorView({
      state: this._state,
      parent: this.renderRoot.querySelector('#editor'),
    });    
  }

  render() {
    return html`<div id="editor"></div>`;
  }

}


export function editorFactory(): CodeEditor {
  return new LeafEditor();
};