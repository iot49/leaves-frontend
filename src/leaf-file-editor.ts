import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LeafEditor, LeafNbEditor } from '.';
import { shared_css } from './assets/css/shared_styles';


@customElement('leaf-file-editor')
export class LeafFileEditor extends LitElement {    

  static styles = [
    shared_css,
    css`
      :host {
        --tab-bar-height: 30px;
      }
      main {
        width: 100%;
      }

      /* file viewer **********************************************************/
      sl-split-panel {
        height: 100%;
      }
      section {
        overflow: auto;
      }
      #file-viewer {
        display: flex;
        flex-direction: column;
        overflow: auto;
      }
      header {
        display: flex;
        justify-content: center;
        height: var(--tab-bar-height);
        background-color: var(--sl-color-neutral-300);
      }

      /* editor ***************************************************************/
      sl-tab-panel {
        /* ~15px accounts for horizontal scrollbar */
        /* use max-height to position horizontal scrollbar immediately below content */
        height: calc(100vh - var(--page-header-height) - var(--tab-bar-height) - 15px);
        /* width computed in event handler (see connectedCallback) */
      }
      sl-tab {
        display: flex;
        align-items: center;
      }
      sl-tab::part(base) {
        border-right: 1px solid var(--sl-color-neutral-0);
        border-radius: 0;
        height: var(--tab-bar-height);
        padding: 5px 20px;
        background-color: var(--sl-color-neutral-300);
      }
      sl-tab[active]::part(base) {
        background-color: var(--sl-color-neutral-0);
      }
      sl-tab-group::part(tabs) {
        background-color: var(--sl-color-neutral-100);
        border: none;
      }
    `
  ];

  @property({ attribute: false })
  rootDir: FileSystemDirectoryHandle;

  @state()
  private tabs: { handle: FileSystemFileHandle, editor: LeafEditor }[] = [];

  @state()
  private active_tab = -1;

  async connectedCallback() {
    super.connectedCallback();

    // split panel width
    this.addEventListener('sl-reposition', () => {
      const pos = this.renderRoot.querySelector('sl-split-panel').positionInPixels;
      const tab = this.renderRoot.querySelector('sl-tab-panel');
      // ugly but works
      if (tab) tab.style.width = `calc(100vw - ${pos}px - 16px)`;  
    });

    // cmd-S save command
    this.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 's':
          if (event.metaKey || event.ctrlKey) {
            if (this.active_tab >= 0 && this.active_tab < this.tabs.length) {
              const tab = this.tabs[this.active_tab];
              tab.editor.save(tab.handle);
              return event.preventDefault();
            }
          }
      }
    });
    // auto-save
    const interval = 5_000;
    setInterval(() => {
      for (const tab of this.tabs) tab.editor.save(tab.handle);
    }, interval);

    // open file
    this.addEventListener('open-file', async (e: CustomEvent) => {
      const handle = e.detail as FileSystemFileHandle;
      // already open?
      for (const [ index, t ] of this.tabs.entries()) { 
        if (await t.handle.isSameEntry(handle)) {
          this.active_tab = index;
          return;
        }
      }
      const file = await handle.getFile();
      const content = await file.text();
      const ext = handle.name.split('.').pop();
      const editor = ext === 'nb' ? new LeafNbEditor(file.name, content) as any : new LeafEditor(content, ext);
      this.tabs = [...this.tabs, { handle: handle, editor: editor }];
      this.active_tab = this.tabs.length - 1;
    });
  }

  render() {
    return html`
      <leaf-page>
        <nav slot="nav">Develop</nav>
        <main>
          <sl-split-panel position-in-pixels="250">

            <div id="file-viewer" slot="start">
              <header>Header</header>
              <section>
                <leaf-file-viewer></leaf-file-viewer>
              </section>         
            </div>

            <div id="tabs" slot="end">
              <sl-tab-group>
                ${this.tabs.map((tab, i) =>
                  html`
                    <sl-tab slot="nav" panel="${i}" ?active=${this.active_tab === i} closable
                      @sl-close=${() => {
                        this.tabs[i].editor.save(tab.handle);
                        this.tabs.splice(i, 1);
                        this.tabs = [...this.tabs];
                        if (this.active_tab >= this.tabs.length) this.active_tab = 0;
                      }}
                    >${tab.handle.name}</sl-tab>
                    <sl-tab-panel name="${i}" ?active=${this.active_tab === i}>${tab.editor}</sl-tab-panel>
                  `
                )}
              </sl-tab-group>
            </div>

          </sl-split-panel>
        </main>
      </leaf-page>
    `;
  }

}
