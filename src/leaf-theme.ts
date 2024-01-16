import { html, css, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { SlSwitch } from '@shoelace-style/shoelace';
import { shared_css } from './assets/css/shared_styles';


@customElement('leaf-theme')
export class LeafTheme extends LitElement {

  static styles = [
    shared_css,
    css`
      :host {
        /* this works, but I don't know how to apply as theme. */
        --sl-color-primary-50:  var(--sl-color-pink-50);
        --sl-color-primary-50:  var(--sl-color-pink-50);
        --sl-color-primary-100: var(--sl-color-pink-100);
        --sl-color-primary-200: var(--sl-color-pink-200);
        --sl-color-primary-300: var(--sl-color-pink-300);
        --sl-color-primary-400: var(--sl-color-pink-400);
        --sl-color-primary-500: var(--sl-color-pink-500);
        --sl-color-primary-600: var(--sl-color-pink-600);
        --sl-color-primary-700: var(--sl-color-pink-700);
        --sl-color-primary-800: var(--sl-color-pink-800);
        --sl-color-primary-900: var(--sl-color-pink-900);
        --sl-color-primary-950: var(--sl-color-pink-950);
      }
      main {
        overflow: auto;
        width: 100%;
        margin: 5px;
      }
      .line {
        display: flex;
        margin: 10px;
      }
      .line div {
        display: flex;
        flex: 1 1 100px;
      }
      .row {
        display: flex;
        margin: 10px;
      }
      .row div {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 1.8cm;
        margin: 2px 5px;
      }
      .patch {
        height: 1.8cm;
        border: 1px solid var(--sl-color-primary-900);
      }
      h1 {
        font-size: var(--sl-font-size-3x-large); 
        font-weight: var(--sl-font-weight-bold);
        padding: 0;
        margin-top: 10px;
        margin-bottom: 5px;
      }
      .description {
        display: flex; 
        flex-direction: column;
      }
      .it {
        font-style: italic;
        color: red;
      }
  `];


  render() {
    let styles = [ 'primary', 'success', 'warning', 'danger', 'neutral', ];
    styles = styles.concat([ 'gray', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal' ]);
    styles = styles.concat([ 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose' ]);
    const levels = [ 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 ];
    const font_style = [ 'sans', 'mono', 'serif'];
    const font_size = [ '2x-small', 'x-small', 'small', 'medium', 'large', 'x-large', '2x-large' ];
    // const font_size = [ 'small', 'medium', 'large' ];
    // const font_weight = [ 'light', 'normal', 'semibold', 'bold' ];
    const font_weight = [ 'normal', 'bold' ];
    return html`
      <leaf-page>
        <nav slot="nav">Theme</nav>
        <main>
          <h2><a href="https://pictogrammers.com/library/mdi/">Pictogrammers Icons</a></h2>
          <h2><a href="https://pictogrammers.com/docs/library/mdi/guides/home-assistant/">HomeAssistant Icons</a></h2>
          <div>Theme: <sl-switch @sl-change=${e => document.querySelector('body').setAttribute('theme', e.target.checked ? 'dark' : 'light')}></sl-switch></div>
          <h1>Colors</h1>
          <div class="description">
            <div>color: var(--sl-color-<span class="it">primary/success/warning</span>-<span class="it">50/100/.../900/950</span>); </div>
          </div>
          <div class="column">
            <div class="row">
              <div></div>
              ${levels.map(level => 
                html`<div>${level}</div>`
              )}
            </div>          
            ${styles.map(style => 
              html`<div class="row">
                <div>${style}</div>
                ${levels.map(level => 
                  html`<div class="patch" style="background-color: var(--sl-color-${style}-${level})"></div>`
                )}
              </div>`
            )}         
          </div>
          <div class="row">
            <div>neutral</div>
            <div>0</div>
            <div class="patch" style="background-color: var(--sl-color-neutral-0)"></div>
            <div>1000</div>
            <div class="patch" style="background-color: var(--sl-color-neutral-1000)"></div>
          </div>

          <h1>Fonts</h1>
          <div class="description">
            <div>font-family: var(--sl-font-<span class="it">sans/serif/mono</span>); </div>
            <div>font-size: var(--sl-font-size-<span class="it">2x-small/x-small/small/medium/large</span>); </div>
            <div>font-weight: var(--sl-font-weight-<span class="it">normal/bold</span>);</div>
          </div>
          ${font_style.map(style =>
            html`
            <div style="font-family: var(--sl-font-${style}); font-size: var(--sl-font-size-2x-large); font-weight: var(--sl-font-weight-bold)">${style}</div>
            ${font_size.map(size =>
              html`
                ${font_weight.map(weight =>
                  html`
                    <div class="line">
                      <div>${weight} (${size})</div>
                      <div style="font-family: var(--sl-font-${style}); font-size: var(--sl-font-size-${size}); font-weight: var(--sl-font-weight-${weight})">The quick brown dog jumps ... 0123456789.</div>
                    </div>
                  `
                )}
              `
            )}
            `
          )}
        </main>
      </leaf-page>
    `;
  }

}
