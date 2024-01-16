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


// yaml: https://github.com/codemirror/dev/issues/306
// sizing: https://discuss.codemirror.net/t/fill-a-div-with-the-editor/5248/5


@customElement('leaf-editor')
export class LeafEditor extends LitElement {

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
  language = "py";

  private _state: EditorState;
  private _view: EditorView;
  private _language_comp = new Compartment();
  public changed = false;

  constructor(initial_doc = "", language = "py") {
    super();
    this.language = language;
    let updateExtension = EditorView.updateListener.of(update => {
      if (update.docChanged) this.changed = true;
    });
    this._state = EditorState.create({
      doc: initial_doc,
      extensions: [
        basicSetup, 
        updateExtension,
        // keymap.of([ { key: 'Tab', run: acceptCompletion } ]), 
        keymap.of([ indentWithTab ]),
        this._language_comp.of(this.languageFor(language)),
        indentUnit.of("    "), 
      ],
    });
  }

  public switchLanguage(language: string) {
    if (this.language == language) return;
    this._view.dispatch({
      effects: this._language_comp.reconfigure(this.languageFor(language))
    });
    this.language = language;
  }

  public async save(handle: FileSystemHandle) {
    if (!this.changed) return;
    this.changed = false;
    const writable = await (handle as any).createWritable();
    await writable.write(this.getDoc());
    await writable.close();
  }

  public getDoc() {
    return this._view ? this._view.state.doc.toString() : this._state.doc.toString();
  }

  public setDoc(doc: string) {
    this._view.dispatch({changes: {
      from: 0,
      to: this._view.state.doc.length,
      insert: doc
    }});  
  }

  public setFocus() {
    if (this._view) this._view.focus();
  }

  private languageFor(lang: string) {
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
    return lang in languages ? languages[lang]() : [];    
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
