import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { type IEventBus, eventbusContext } from './app/contexts';


/* TODO:
- table -> flex
- tr -> lit-element
- filter by level
*/

@customElement('leaf-log')
export class LeafLog extends LitElement {

  private epoch_offset = (window as any).leaf.config.app.epoch_offset;
 
  @consume({ context: eventbusContext, subscribe: false })
  @property({ attribute: false })
  private eventbus: IEventBus;

  @state({})
  private log: Array<any>;

  static styles = css`
    main {
      display: flex;
      flex-direction: column;
      padding: 3px;
      font-size: 13px;
      line-height: 1.3;
      font-family: 'menlo', consolas, 'DejaVu Sans Mono', monospace;
      font-family: 'menlo';
    }

    .entry {
      display: flex;
    }
    span {
      display: flex;
      margin-right: 1rem;
      margin-bottom: 5px;
    }
    .timestamp {
      flex: 0 0 11rem;
    }
    .level {
      flex: 0 0 5rem;
    }
    .name {
      flex: 0 0 10rem;
    }
    .message {
      flex: 0 0 auto;
      display: block;
      white-space: pre-wrap;
      word-break: break-all;
      word-wrap: break-word;
    }
  `

  private onEvent(event) {
    switch (event.type) {
      case 'get_log_':
        this.log = event.data;
        break;
      case 'log':
        if (this.log) this.log = [ ...this.log, event ];
        break;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.eventbus.addOnEventListener(this.onEvent.bind(this));
    this.eventbus.postEvent({ type: 'get_log' })
  }

  disconnectedCallback(): void {
    this.eventbus.removeOnEventListener(this.onEvent);
    super.disconnectedCallback()
  }

  entry_template(entry) {
    return html`
      <div class="entry">
        <span class="timestamp">${new Date(1000*(entry.ct+this.epoch_offset)).toISOString().split('.')[0]}</span>
        <span class="level">${entry.levelname}</span>
        <span class="name">${entry.name}</span>
        <span class="message">${entry.message}</span>
      </div>
    `
  }

  render() {
    if (!this.log) {
      return html`<kor-spinner label="Loading log ..."></kor-spinner>`
    }

   return html`
      <leaf-page>
        <nav slot="nav">Log</nav>

        <main>
          ${this.log.map((log_entry) =>
            this.entry_template(log_entry)
          )}
        </main>

      </leaf-page>
    `;
  }

}
