import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { type IEventBus, eventbusContext } from './app/contexts';

import { EditorView, basicSetup } from "codemirror"
// import { javascript } from "@codemirror/lang-javascript"
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';


@customElement('leaf-editor')
export class LeafEditor extends LitElement {

  @consume({ context: eventbusContext, subscribe: false })
  @property({ attribute: false })
  private eventbus: IEventBus;

  @state()
  private printer = "";

  //private initialState: EditorState;
  private view: EditorView;

  static styles = css`
    // TODO: import from index.css
    :host {
      --base-0: 218, 214, 0;
      display: flex;
    }
    main {
      margin: 10px;
    }
    #editor {
      background-color: rgb(252,252,252)
    }
    kor-button {
      margin-top: 10px;
      margin-bottom: 10px;
    }
  `

connectedCallback() {
  super.connectedCallback();
  this.eventbus.addOnEventListener(this.onEvent.bind(this));
}

disconnectedCallback(): void {
  this.eventbus.removeOnEventListener(this.onEvent);
  super.disconnectedCallback()
}

private onEvent(event) {
  switch (event.type) {
    case 'print':
      this.printer += event.data
      break; 
    case 'log':
      if (event.name === "user_features.dev")
        this.printer += event.message
      break;
  }
}

firstUpdated(): void {
    this.view = new EditorView({
      doc: `import time

for i in range(10):
    print(i, i**4)
    time.sleep_ms(10)`,
      parent: this.renderRoot.querySelector('#editor'),
      extensions: [
        basicSetup, 
        python(),
        indentUnit.of("    "),
      ],
    });
  }

  render() {
    return html`
      <leaf-page>
        <nav slot="nav">Editor</nav>

        <main>
          <div id="editor"></div>
          <kor-button @click=${this.exec_cmd} label="Exec" icon="arrow_right"></kor-button>

          <leaf-code>${this.printer}</leaf-code>
        </main>
      </leaf-page>
    `
  }

  exec_cmd() {
    this.printer = ""
    this.eventbus.postEvent({ type: 'exec', code: this.view.state.doc.toString() });
  }

}
