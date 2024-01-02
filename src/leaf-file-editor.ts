import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

import { LeafEditor, LeafNbEditor, LeafTabbedPane } from '.';
import { fsRoot } from './app/app';


@customElement('leaf-file-editor')
export class LeafFileEditor extends LitElement {

  static styles = css`
    :host {
      --base-0: 23, 125, 37;
    }
    leaf-file-viewer {
      overflow: hidden;
    }
    leaf-tabbed-pane {
      height: 100%;
    }
  `

  @query('leaf-tabbed-pane')
  private tabs_el: LeafTabbedPane;

  @state()
  private editors: any[] = [];   // { handle, editor }

  constructor() {
    super();
    // cmd-S save command
    this.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 's':
          if (event.metaKey || event.ctrlKey) {
            const e = this.editors[this.tabs_el.selected_index];
            e.editor.save(e.handle);
            return event.preventDefault();
          }
      }
    });
    // auto-save
    const interval = 20_000;
    setInterval(() => {
      for (const e of this.editors) e.editor.save(e.handle);
    }, interval);
  }

  disconnectedCallback(): void {
    // console.log('disconnected - save!')
    for (const e of this.editors) e.editor.save(e.handle);
  }
  
  render() {
    return html`
      <leaf-page>
        <nav slot="nav">Code Developer</nav>
        <leaf-split left_width=220>
          <leaf-file-viewer slot="left" 
            .hostDir=${fsRoot}
            @file-system=${(event) => this.file_system(event.detail)} 
            @open-file=${(event) => this.open_file(event.detail)}
          ></leaf-file-viewer>
          <leaf-tabbed-pane slot="right" .tabs=${this.editors.map(function (e) { return { name: e.handle.name, element: e.editor } })}>
            ${this.editors.map((e) =>
              html`<div data-name=${e.handle.name}>${e.editor}</div>`
            )}
          </leaf-tabbed-pane>
        </leaf-split>
      </leaf-page>
    `
  }

  async file_system(detail) {
    switch (detail.action) {
      case 'delete':
        this.editors = this.editors.filter((e) => e.handle !== detail.file_handle);
        break;
    }
  }

  async open_file(detail) {
    const i = this.editors.findIndex((e) => e.handle === detail.file_handle);
    if (i >= 0) {
      // already open
      this.tabs_el.selected_index = i;
      return;
    }
    const file = await detail.file_handle.getFile();
    const content = await file.text();
    const ext = detail.file_handle.name.split('.').pop();
    const editor = ext === 'nb' ? new LeafNbEditor(content) : new LeafEditor(content, ext);
    this.editors = [...this.editors, { handle: detail.file_handle, editor: editor }];
    this.tabs_el.selected_index = this.editors.length - 1;
  }

}
