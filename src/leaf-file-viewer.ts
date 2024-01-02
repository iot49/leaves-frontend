import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { until } from 'lit/directives/until.js';

import { korInput, korMenuItem } from './kor';
import { LeafPopup } from '.';

@customElement('leaf-file-viewer')
export class LeafFileViewer extends LitElement {

  @property({ attribute: false })
  private hostDir: FileSystemDirectoryHandle;

  static styles = css`
    ul {
      list-style-type: none;
    }
    #viewer {
      margin: 10px;
      padding: 0;
      overflow: hidden;
    }
    kor-menu-item, leaf-file-handle, ul {
      margin: 0;
      padding: 0;
    }
    kor-menu-item:hover {
      background-color: rgb(var(--base-4));
    }
  `

  render() {
    return html`
      <main>
        <ul id="viewer">
          <leaf-file-handle .file_handle=${this.hostDir}></leaf-file-handle>
        </ul>
      </main>
    `
  }

}


@customElement('leaf-file-handle')
class LeafFileHandle extends LitElement {

  static styles = css`
    ul, li {
      list-style-type: none;
      padding-top: 0;
      padding-bottom: 0;
      margin-top: 0;
      margin-bottom: 0;

    }
    kor-menu-item {
      padding: 0;
      margin: 0;
      background-color: white;
    }
    kor-menu-item:hover {
      background-color: rgb(var(--base-4));
    }
    .content {
      margin: 10px;
    }
    .name-content {
      margin: 20px;
    }
    .buttons {
      display: flex;
    }
    kor-button {
      margin-left: 2rem;
      margin-top: 2rem;
    }
  `

  @property({ attribute: false })
  file_handle: FileSystemHandle;

  @property({ type: Boolean })
  open: boolean = false;       // directories only

  @property({ type: Boolean })
  deleted = false;   // underlying file/directory has been deleted

  @query('.file_popup')
  file_popup: LeafPopup;

  @query('.dir_popup')
  dir_popup: LeafPopup;

  @query('.name_dialog')
  name_dialog: LeafPopup;

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
    const icon = { file: 'description', directory: this.open ? 'folder_open' : 'folder' };
    return html`
      <li class=${this.file_handle.kind}>
        <kor-menu-item class="item" icon=${icon[this.file_handle.kind]} label=${this.file_handle.name} @click=${this.openClose}></kor-menu-item>
        ${until(this.files().then(res => res), html`<ul>Loading ...</ul>`)}
      </li>

      <leaf-popup class="file_popup" @click=${this.popup_event}>
        <div class="content">
          <kor-menu-item id="rename"   icon="post_add" label="Rename ..."></kor-menu-item>
          <kor-menu-item id="delete"   icon="delete" label="Delete"></kor-menu-item>
        </div>
      </leaf-popup>

      <leaf-popup class="dir_popup"  @click=${this.popup_event}>    
        <div class="content">
          <kor-menu-item id="new_file" icon="arrow_right" label="New File ..."></kor-menu-item>
          <kor-menu-item id="new_dir"  icon="cancel_presentation" label="New Folder ..."></kor-menu-item>
          <kor-menu-item id="delete"   icon="delete" label="Delete"></kor-menu-item>
        </div>
      </leaf-popup>

      <leaf-popup class="name_dialog">
        <div class="name-content">
          <kor-input class="name" label="Name" value="" autofocus></kor-input>
            <div class="buttons">
              <kor-button label="cancel" color="tertiary" @click=${() => this.name_dialog.hide()}></kor-button>
              <kor-button label="OK" @click=${this.set_name_event}></kor-button>
            </div>

        </div>
      </leaf-popup>
    `;
  }

  openClose() {
    if (this.file_handle.kind === 'directory') {
      this.open = !this.open;
    } else {
      this.dispatchEvent(new CustomEvent('open-file', {
        detail: { file_handle: this.file_handle },
        bubbles: true, composed: true
      }));
    }
  }

  firstUpdated(): void {
    this.renderRoot.querySelector('.item').addEventListener("contextmenu", (event: PointerEvent) => {
      const popup = this.file_handle.kind === 'file' ? this.file_popup : this.dir_popup;
      popup.show(event);
      // hide after click anywhere
      document.addEventListener('click', () => { popup.hide() }, { once: true });
      return event.preventDefault();
    });
  }

  async popup_event(event: PointerEvent) {
    const task = (event.target as HTMLElement).id;
    switch (task) {
      case 'new_file':
      case 'new_dir':
      case 'rename':
        (this.name_dialog.querySelector('.name') as korInput).value = '... ' + this.file_handle.name;
        this.name_dialog.show(event);
        break
      case 'delete':
        await this.remove_handle(this.file_handle);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('file-system', {
          detail: { action: task, file_handle: this.file_handle },
          bubbles: true, composed: true
        }));
        break;
    }
  }

  async remove_handle(handle) {
    if (handle.kind === 'directory') {
      // recursively empty
      for await (const h of (this.file_handle as any).values()) {
        this.remove_handle(h);
      }
    }
    await handle.remove();
    this.deleted = true;
  }

  async set_name_event() {
    this.name_dialog.hide();
    const task = this.name_dialog.target.id;
    const name = (this.name_dialog.querySelector('.name') as korInput).value;
    if (!name.length) return;
    const fh = this.file_handle as any;
    switch (task) {
      case 'new_file':
        await fh.getFileHandle(name, { create: true });
        // force re-create
        this.files_cache = null;
        break
      case 'new_dir':
        await fh.getDirectoryHandle(name, { create: true });
        this.files_cache = null;
        break
      case 'rename':
        await fh.move(name);
        (this.renderRoot.querySelector('.item') as korMenuItem).label = name;
        break
    }
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('file-system', {
      detail: { action: task, file_handle: this.file_handle },
      bubbles: true, composed: true
    }));
  }

}
