import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import fs from 'indexeddb-fs';


// already imported in index.ts
// ??? theme dark not available in element!
// import './index.css' assert { type: 'css' }; 


@customElement('leaf-scratch')
export class LeafScratch extends LitElement {

  static styles = css`
    :host {
      /* works; but theme attribute on leaf-page does not */
      --base-0: 0, 200, 150;
    }
    main {
      margin: 1rem;
      margin-top: 0.5rem;
    }
    .A, .B {
      display: flex;
    }
    .a {
      display: flex;
      flex: 1 1 0;
      justify-content: flex-start;
    }
    .b {
      display: flex;
      flex: 1 1 0;
      justify-content: center;
    }
    .c {
      display: flex;
      flex: 1 1 0;
      justify-content: flex-end;
    }
  `;

  render() {
    console.log("render scratch");
    return html`
      <leaf-page>
        <nav slot="nav">Scratch</nav>

        <main>
          <div class="A">
            <div class="a">Asdg</div>
            <div class="b">Bdsggdgdgs</div>
            <div class="c">Casfafsfasffasffafasf</div>
          </div>
          <div class="B">
            <div class="a">A</div>
            <div class="b">B</div>
            <div class="c">C</div>
          </div>
          <kor-button label="BrowserFS" @click=${this.bfs}></kor-button>
        </main>
      </leaf-page>
    `;
  }

  async bfs() {
    // Check if a directory exists

    console.log('exists?', await fs.exists('my_directory'));
    await fs.createDirectory('my_directory');
    const directoryExists = await fs.isDirectory('my_directory');

    console.log('de', directoryExists)
  
    // Create a new directory if it doesn't exist
    if (!directoryExists) {
      await fs.createDirectory('my_directory');
    }
  
    // Write data to a file
    const content = 'Hello, world!';

    console.log('wf', content)
    await fs.writeFile('my_directory/my_file.txt', content);
  
    // Read data from the file
    const readContent = await fs.readFile('my_directory/my_file.txt');
    console.log(readContent); // "Hello, world!"
  
    console.log('rd', await fs.readDirectory('my_directory'));


    // Remove the directory and all files within it
    await fs.removeDirectory('my_directory');


  }

}
