import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { type Log, logContext, Config, configContext } from './app/contexts';
import { shared_css } from './assets/css/shared_styles';


@customElement('leaf-log')
export class LeafLog extends LitElement {

  @consume({ context: configContext, subscribe: true })
  @property({ attribute: false })
  private config: Config;

  @consume({ context: logContext, subscribe: true })
  @property({ attribute: false })
  private log: Log;

  static styles = [ 
    shared_css,
    css`
      main {
        display: flex;
        flex-direction: column;
        overflow: auto;
        padding: 3px;
        font-size: 13px;
        line-height: 1.3;
        font-family: 'menlo', consolas, 'DejaVu Sans Mono', monospace;
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
    ` ];

  entry_template(entry) {
    const epoch_offset = this.config.app.epoch_offset || 946684800;
    return html`
      <div class="entry">
        <span class="timestamp">${new Date(1000 * (entry.ct + epoch_offset)).toISOString().split('.')[0]}</span>
        <span class="level">${entry.levelname}</span>
        <span class="name">${entry.name}</span>
        <span class="message">${entry.message}</span>
      </div>
    `
  }

  render() {
    return html`
      <leaf-page>
        <nav slot="nav">Log</nav>

        <main>
          ${this.log.map((log_entry) => this.entry_template(log_entry))}
        </main>

      </leaf-page>
    `;
  }

}
