import { html, css, TemplateResult, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';
import { shared_css } from './assets/css/shared_styles';
import { consume } from '@lit/context';
import { settingsContext, Settings } from './app/contexts';

@customElement('leaf-file-viewer')
export class LeafFileViewer extends LitElement {

  static styles = [
    shared_css,
    css`
      header {
        display: flex;       
        height: var(--tab-bar-height);
        background-color: var(--sl-color-neutral-300);
      }
    `];

  @consume({ context: settingsContext, subscribe: true })
  @property({ attribute: false })
  private settings: Settings;

  @state()
  private rootDir: FileSystemDirectoryHandle;

  @state()
  private requestPermission = false;

  async connectedCallback() {
    super.connectedCallback();

    // This may help (testing: throws DOMException)
    // https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api
    
    // attempt to get access permission for a directory retrieved from indexedDB
    // no dice ...
    const root = this.settings.root_dir;
    this.rootDir = root ? root : await navigator.storage.getDirectory(); 
    this.requestPermission = root !== undefined;
    
    // workaround: open browser file system which does not require permission
    // this.rootDir = await navigator.storage.getDirectory(); 
  }

  permissionTemplate() {
    this.requestPermission = false;
    return html`
      <sl-dialog label="Permission" open>
        App requires access to ${this.rootDir.kind} ${this.rootDir.name}.
        <sl-button slot="footer"
          @click=${async () => {
            this.renderRoot.querySelector('sl-dialog').hide();
            this.rootDir = await navigator.storage.getDirectory(); 
            this.requestUpdate();
        }}>Deny</sl-button>
        <sl-button slot="footer" variant="primary"
          @click=${async () => {
            // workaround to get browser to grant permission
            this.rootDir = await (window as any).showDirectoryPicker({ mode: "readwrite" });
            this.renderRoot.querySelector('sl-dialog').hide();
            this.requestUpdate();
        }}>Grant</sl-button>
      </sl-dialog>
    `;
  }

  render() {
    // if (this.requestPermission) return this.permissionTemplate();
    if (!this.rootDir) return html`<sl-spinner></sl-spinner>`;
    return html`
      <header>
        <sl-icon-button name="folder-open-outline"
          @click=${async () => {
            this.rootDir = await (window as any).showDirectoryPicker({ mode: "readwrite" });
            this.settings.root_dir = this.rootDir;
            this.requestUpdate();
          }}></sl-icon-button>
        <sl-icon-button name="folder-star-outline"
          @click=${async () => {
            this.rootDir = await navigator.storage.getDirectory();
            this.settings.root_dir = undefined;   // use undefined to mark browser file system
            this.requestUpdate();
          }}></sl-icon-button>
      </header>    
      <sl-tree>
        <leaf-file-handle .file_handle=${this.rootDir}></leaf-file-handle>
      </sl-tree>
    `
  }

  getFSRoot() {
    return new Promise<FileSystemDirectoryHandle>(function(resolve, reject) {
      (window as any).showDirectoryPicker({ mode: "readwrite" }).then(
        function(value) { resolve(value); },
        function(error) { reject(error); }
      )
    });
  }

}


@customElement('leaf-file-handle')
class LeafFileHandle extends LitElement {
  
  static styles = [
    shared_css,
    css`
      ul, li {
        padding: 0;
      }
      #subtree {
        padding-left: 26px;
      }
      sl-tree-item:hover {
        background-color: var(--sl-color-neutral-100);
      }
      sl-tree-item::part(expand-button) {
        display: none;
      }
      sl-input::part(base), sl-input::part(input) {
        border: none;
        opacity: 1;
        cursor: text;
        background-color: inherit;       
        height: inherit;
        margin: 0;
        padding: 0;
      }
      .rename sl-icon {
        font-size: var(--sl-font-size-x-large);
        color: var(--sl-color-danger-600);
      }
      .bold {
        font-weight: var(--sl-font-weight-bold);
        font-weight: 800;
        color: red;
      }
    `
  ];

  // hack to pass filehandles when dragging
  // we exploit that only one drag happens at a time
  static draggedFileHandle: LeafFileHandle = undefined;

  @property({ attribute: false })
  file_handle: FileSystemHandle;

  @property({ type: Boolean })
  open: boolean = false;       // directories only

  @property({ type: Boolean })
  deleted = false;   // underlying file/directory has been deleted

  private files_cache: TemplateResult;

  async gen2array<T>(gen: AsyncIterable<T>): Promise<T[]> {
    const out: T[] = []
    for await (const x of gen) {
      out.push(x)
    }
    return out
  }

  private async files() {
    if (!this.open || this.file_handle.kind === 'file') return html``;
    if (!this.files_cache) {
      const templates = [];
      const values: any[] = await this.gen2array(await (this.file_handle as any).values());
      const sorted = values.sort((a, b) => {
        return a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name);
      });
      for (const handle of sorted) {
        templates.push(html`<leaf-file-handle .file_handle=${handle}></leaf-file-handle>`)
      }
      this.files_cache = html`<ul>${templates}</ul>`
    }
    return this.files_cache;
  }

  render() {
    if (this.deleted || !this.file_handle) return html``;
    const icon = { file: 'file-document-outline', directory: this.open ? 'folder-open-outline' : 'folder-outline' };
    const name = this.file_handle.name.length > 0 ? this.file_handle.name : '<browser>';
    return html`
      <li class=${this.file_handle.kind} @click=${this.openClose}>
        <sl-tree-item class="item">
          <sl-icon 
            class="icon icon-${this.file_handle.kind}" 
            name=${icon[this.file_handle.kind]} 
            draggable="true"></sl-icon>
          <sl-dropdown>
            <sl-menu>
              ${
                this.file_handle.kind === 'directory' ?
                  html`
                    <sl-menu-item value="newfile">New File</sl-menu-item>
                    <sl-menu-item value="newdir">New Folder</sl-menu-item>
                  ` :
                  html``
              }
              <sl-menu-item value="delete">Delete ${this.file_handle.name}</sl-menu-item>
            </sl-menu>
          </sl-dropdown>          
          <sl-input size="small" value=${name} style="width: ${name.length}ch;" disabled></sl-input>
        </sl-tree-item>
        <div id="subtree">
          ${until(this.files().then(res => res), html`<ul>Loading ...</ul>`)}
        </div>
      </li>

      <sl-alert class="rename" variant="danger" closable>
        <sl-icon class="icon" name="alert-octagon"></sl-icon>
        <div class="bold">Rename of ${this.file_handle.kind} "${this.file_handle.name}" failed.</div><br />
        Note: Chrome does not (yet) support renaming folders.
      </sl-alert>
    `;
  }

  openClose(event) {
    // suppress menu actions (new file, etc)
    if (event.target.classList.contains('icon')) {
      if (this.file_handle.kind === 'directory') {
        this.open = !this.open;
      } else {
        this.dispatchEvent(new CustomEvent('leaf-open', {
          detail: this.file_handle,
          bubbles: true, composed: true
        }));
      }
    }
  }

  firstUpdated() {
    const menu = this.renderRoot.querySelector('sl-menu');
    menu.addEventListener("sl-select", async (event: CustomEvent) => {
      const fh = this.file_handle as any;
      switch (event.detail.item.value) {
        case 'newfile':
          await fh.getFileHandle('untitled.nb', { create: true });
          break;
        case 'newdir':
          await fh.getDirectoryHandle("Untitled", { create: true });
          break;
        case 'delete':
          await fh.remove();
          this.deleted = true;
          break;
      }
      // structure changed - force redraw
      this.files_cache = null;
      this.requestUpdate();
    });
    const input = this.renderRoot.querySelector('sl-input');
    input.addEventListener("sl-change", async () => {
      input.disabled = true;
      try {
        await (this.file_handle as any).move(input.value);
        this.requestUpdate();
      }
      catch (error) {
        (this.renderRoot.querySelector('.rename') as any).show();
      }
    });
    input.addEventListener("dblclick", () => {
      input.disabled = false;
    });
    this.renderRoot.querySelector(".item").addEventListener("contextmenu", (event: PointerEvent) => {
      // hide all possibly open dropdowns (not clear how since they are in different instances of leaf-file-handle)
      // ... (we don't have a list of all leaf-file-handle instances and because of the shadow tree it's not easy to get)
      //
      // now show dropdown for this leaf-file-handle
      this.renderRoot.querySelector("sl-dropdown").show();
      return event.preventDefault();
    });

    // drag & drop
    const icon = this.renderRoot.querySelector("sl-icon");
    icon.addEventListener('dragstart', () => {
      LeafFileHandle.draggedFileHandle = this;
    });
    icon.addEventListener('dragover', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('icon-directory')) e.preventDefault();
    });
    icon.addEventListener('drop', async () => {
      // do the move ...
      const src = LeafFileHandle.draggedFileHandle;
      const dst = this;
      console.log('move', src.file_handle, 'to', dst.file_handle);
      await (src.file_handle as any).move(dst); // BUG in Chrome?, src.file_handle.name);
      // now update the view - FIX THIS ...
      src.deleted = true;
      dst.files_cache = null;
      src.requestUpdate();
      dst.requestUpdate();
      // not really needed ...
      LeafFileHandle.draggedFileHandle = undefined;
    });
  }

}
