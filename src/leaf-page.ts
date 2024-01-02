import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { go, eventbus } from './app/app';

@customElement('leaf-page')
export class LeafPage extends LitElement {


  @property({ type: Boolean })
  mobile: boolean;

  static styles = [
    css`
      .page {
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
      }

      nav {
        display: flex;
        align-items: center;
        min-height: 2.75rem;
        line-height: 1rem;
        padding: 0 0.8rem;
        background-color: rgb(var(--base-0));
        color: var(--text-4);
        font-weight: bold;
        font-size: 150%;
      }

      .nav-slot {
        display: flex;
        flex: 1;
        justify-content: center;
      }

      .leaf-icon {
        display: flex;
        flex: 1;
        justify-content: flex-start;
      }

      .menu {
        display: flex;
        flex: 1;
        justify-content: flex-end;
        color: var(--bg-color);
      }

      .dropdown {
        display: none;
        position: absolute;
        right: 0.5rem;
        top: 2rem;
        bottom: auto;
        padding: 0.8rem;
        border-radius: var(--border-radius);
        font-size: 75%;
        background-color: rgb(var(--base-4));
        box-shadow: var(--shadow-1);
        z-index: 1000;        
      }
      .menu:hover .dropdown {
        display: inline;
      }

      main {
        background-color: var(--bg-color);
        overflow-y: auto;
        height: 100%;
      }

      .mobile > nav > .leaf-icon {
        display: none;
      }
      
      .mobile > nav > .nav-slot {
        justify-content: flex-start;
      }
      
      @media screen and (max-width: 400px) {
        .mobile {
          flex-direction: column-reverse;
        }
        .mobile > nav > .menu > .dropdown {
          top: auto;
          bottom: 2rem;
        }
      }
      `
  ];

  render() {
    return html`
      <div class="page ${this.mobile ? 'mobile' : ''}">
        <nav>
          <div class="leaf-icon">
            <div @click=${() => go("/")}>
              <kor-icon icon="eco" color="var(--text-4)" size="m"></kor-icon>
          </div>
          </div>
          <div class="nav-slot"><slot name="nav"></slot></div>
          <!-- right top menu -->
          <div class="menu">
            <kor-icon icon="more_vert" color="var(--text-4)"></kor-icon>
            <div class="dropdown" @click=${e => go(e.target.id)}>
                <kor-menu-item id="log"      icon="cabin"        label="Log"></kor-menu-item>
                <kor-menu-item id="settings" icon="settings"     label="Settings"></kor-menu-item>
                <kor-menu-item id="dev"      icon="construction" label="Dev"></kor-menu-item>
                <kor-menu-item id="scratch"  icon="bolt"         label="Scratch"> </kor-menu-item>
            </div>
          </div>  
        </nav>
        <main>
          <slot></slot>
        </main>
      </div>
    `;
  }

}
