import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('leaf-file-viewer')
export class LeafFileViewer extends LitElement {

  @state()
  private entries_dict = [];
  private entries_list: Array<any>;

  static styles = css`
    ul {
      list-style-type: none;
    }
    #viewer {
      margin: 0;
      padding: 0;
    }
    .closed {
      display: none;
    }
  `

connectedCallback() {
  super.connectedCallback();
}

async listDirs(handles: any) {
    const entries = []

    for await (const handle of handles) {
      const { kind, name } = handle;
  
      switch (kind) {
        case 'file':
          entries.push({ kind, name, handle });
          break
        case 'directory':
          const e = await this.listDirs(await handle.values()).catch(console.error);
          entries.push({ kind, name, handle, entries: e });
          break
      }
    }
    entries.sort((a, b) => {
      return a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name);
    });
    return entries
  }

  protected async firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): Promise<void> {
    const directoryHandle = await (window as any).showDirectoryPicker(
      { mode: "readwrite" }
    );
    this.entries_list = [];
    this.entries_dict = await this.listDirs(directoryHandle.values());
  }

  render_entry(entry) {
    const index = this.entries_list.length;
    this.entries_list.push(entry);
    if (entry.kind === 'file') {
      return html`
        <li class="file"><kor-menu-item data-index=${index} icon="description" label=${entry.name}></kor-menu-item></li>
      `
    } else {
      return html`
        <li class="dir"><kor-menu-item data-index=${index} icon="folder" label=${entry.name}></kor-menu-item>
          <ul class="folder-content closed">${this.render_entries(entry.entries)}</ul>
        </li>
      `
    }
  }

  render_entries(entries) {
    const templates = [];
    for (const entry of entries) templates.push(this.render_entry(entry));
    return html`${templates}`;
  }

  render() {
    return html`
      <ul id="viewer" @click=${this.toggle}>
        ${this.render_entries(this.entries_dict)}
      </ul>
    `
  }

  async toggle(event: MouseEvent) {
    const t = event.target as any;
    if (!('icon' in t)) return;
    const entry = this.entries_list[parseInt(t.getAttribute('data-index'))];
    console.log('FH', entry.name, entry.kind, entry.handle);
    if (t.parentElement.classList.contains('dir')) {
      t.icon = t.icon === 'folder' ? 'folder_open' : 'folder';
      t.parentElement.children[1].classList.toggle('closed');
    } else {
      const file = await entry.handle.getFile();
      const content = await file.text();
      console.log('file', t, t.getAttribute('data-index'), t.label, content);
    }
  }

}
