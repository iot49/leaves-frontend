import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { type IEventBus, eventbusContext } from './app/contexts';

import { EditorView, basicSetup } from "codemirror";
import { KeyBinding, keymap } from "@codemirror/view";
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';
import { acceptCompletion, } from '@codemirror/autocomplete';


@customElement('leaf-nb-item')
export class LeafNbItem extends LitElement {

  protected nbKeymap: ReadonlyArray<KeyBinding> = [
    {
      key: 'Shift-Enter', run: () => {
        this.exec_cmd();
        return true;
      }
    },
    { key: 'Tab', run: acceptCompletion },
  ];

  private static _next_id = 1;
  private _id: number;

  @consume({ context: eventbusContext, subscribe: false })
  @property({ attribute: false })
  private eventbus: IEventBus;

  @state()
  private output = "";

  //private initialState: EditorState;
  private view: EditorView;

  static styles = css`
    // TODO: import from index.css
    :host {
      --base-0: 218, 214, 0;
    }
    main {
      margin: 10px;
    }
    #editor {
      background-color: rgb(252,252,252);
    }
    kor-button {
      margin-top: 10px;
      margin-bottom: 10px;
    }
  `

constructor() {
  super();
  this._id = LeafNbItem._next_id;
  LeafNbItem._next_id += 1;
}

connectedCallback() {
  super.connectedCallback();
  // catch print and log events
  this.eventbus.addOnEventListener(this.onEvent.bind(this));
}

disconnectedCallback(): void {
  this.eventbus.removeOnEventListener(this.onEvent);
  super.disconnectedCallback();
}

private onEvent(event) {
  if (event.id !== this._id) return;
  switch (event.type) {
    case 'print':
      this.output += event.data
      break; 
    case 'log':
      if (event.name === "user_features.dev")
        this.output += event.message
      break;
  }
}

firstUpdated(): void {
    this.view = new EditorView({
      doc: 'print(2**1234)',
      parent: this.renderRoot.querySelector('#editor'),
      extensions: [
        basicSetup, 
        keymap.of(this.nbKeymap),
        python(),
        indentUnit.of("    "),
      ],
    });
    this.view.focus();
  }

  render() {
    return html`
      <main>
        <div id="editor"></div>
        <!-- results -->
        <leaf-code>${this.output}</leaf-code>

        <leaf-popup @click=${this.context_cmd}>
          <kor-menu-item id="run" icon="arrow_right" label="Run"></kor-menu-item>
          <kor-menu-item id="clear" icon="cancel_presentation" label="Clear Output"></kor-menu-item>
          <kor-menu-item id="append" icon="post_add" label="Append Cell"></kor-menu-item>
          <kor-menu-item id="delete" icon="delete" label="Delete"></kor-menu-item>
        </leaf-popup>
      </main>

    `
  }

  exec_cmd() {
    this.output = ""
    this.eventbus.postEvent({ 
      type: 'exec', 
      code: this.view.state.doc.toString(),
      id: this._id
    });
    if (this === this.parentElement.lastElementChild) {
      this.parentElement.appendChild(new LeafNbItem());
    }
  }

  async context_cmd(event) {
    switch (event.target.id) {
      case 'run':
        this.exec_cmd();
        break
      case 'clear':
        this.output = "";
        break
      case 'append':
        const pos = [...this.parentElement.children].indexOf(this);
        this.parentElement.insertBefore(new LeafNbItem(), this.parentElement.children[pos+1]);
        break
      case 'delete':
        if (this.parentElement.children.length > 1) this.remove();
        break
    }
  }

}
