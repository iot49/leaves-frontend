import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";

import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { acceptCompletion, } from '@codemirror/autocomplete';
import { indentUnit } from '@codemirror/language';

import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';


// yaml: https://github.com/codemirror/dev/issues/306
// markdown: https://marked.js.org/demo
// sizing: https://discuss.codemirror.net/t/fill-a-div-with-the-editor/5248/5


@customElement('leaf-editor')
export class LeafEditor extends LitElement {

  private _state: EditorState;
  private _view: EditorView;
  private language = new Compartment();

  constructor(initial_doc: string, language: string) {
    super();
    this._state = EditorState.create({
      doc: initial_doc,
      extensions: [
        basicSetup, 
        // EditorView.updateListener.of(update => console.log('E', update)),
        // keymap.of([ { key: 'Tab', run: acceptCompletion } ]), 
        keymap.of([ indentWithTab ]),
        this.language.of(this.languageFor(language)),
        indentUnit.of("    "), 
      ],

    })
  }

  public switchLanguage(language: string) {
    this._view.dispatch({
      effects: this.language.reconfigure(this.languageFor(language))
    });
    console.log("leaf-editor: language should be switched by now");
  }

  public async save(handle: FileSystemHandle) {
    // TODO: if (hasChanged)
    const writable = await (handle as any).createWritable();
    await writable.write(this.getDoc());
    await writable.close();
    console.log('saved', handle.name);
  }

  public getDoc() {
    return this._view.state.doc.toString();
  }

  public setDoc(doc: string) {
    this._view.dispatch({changes: {
      from: 0,
      to: this._view.state.doc.length,
      insert: doc
    }});  
  }

  public setFocus() {
    this._view.focus();
  }

  private languageFor(lang: string) {
    const languages = {
      py: python,
      js: javascript,
      ts: javascript,
      md: markdown,
      json: json,
    }
    return lang in languages ? languages[lang]() : [];    
  }


  static styles = css`
    #editor {
      background-color: rgb(252,252,252);
      background-color: rgb(var(--base-2));
    }
  `

  firstUpdated(): void {
    const state = this._state;
    this._view = new EditorView({
      state,
      parent: this.renderRoot.querySelector('#editor'),
    });
    this._view.focus();
  }

  render() {
    return html`<div id="editor"></div>`;
  }

}
