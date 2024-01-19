import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { app } from '.';
import { eventbus } from './app/eventbus';
import { shared_css } from './assets/css/shared_styles';

@customElement('leaf-page')
export class LeafPage extends LitElement {

  @property({ type: Boolean })
  mobile: boolean;

  @state()
  private connected = eventbus.connected;

  static styles = [
    shared_css,
    css`
      .page {
        box-sizing: content-box;
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
      }

      nav {
        box-sizing: content-box;
        height: var(--page-header-height);
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        line-height: 1rem;
        padding: 0 0.8rem;
        background-color: var(--sl-color-primary-500);
        color: white;
        font-weight: 500;
        font-size: 150%;
      }

      main {
        box-sizing: content-box;
        height: calc(100vh - var(--page-header-height));
        display: flex;
        flex: 1 1 auto;
        color: var(--sl-color-neutral-1000);
        background-color: var(--sl-color-neutral-0);
       }

      .nav-slot {
        display: flex;
        flex: 1 1 auto;
        justify-content: center;
      }

      .leaf-icon, .menu > sl-icon {
        border-radius: 50%;
        justify-content: flex-start;
      }
      .leaf-icon:hover, .menu > sl-icon:hover {
        background-color:  var(--sl-color-primary-600);
      }

      .menu {
        display: flex;
        flex: 0 0 auto;
        justify-content: flex-end;
        padding-right: 0.2em;
        color: var(--sl-color-neutral-0);
      }
      .menu > sl-icon {
        color: white;
      }

      .dropdown {
        display: none;
        position: absolute;
        right: 0.5rem;
        top: 2rem;
        bottom: auto;
        z-index: 1000;
      }
      .menu:hover .dropdown {
        display: inline;
      }
      sl-menu-item {
        display: flex;
        align-items: center;
      }
      sl-menu-item > sl-icon {
        margin-right: 20px;
        font-size: 18px;
      }

      .mobile > nav > .leaf-icon {
        display: none;
      }
      
      .mobile > nav > .nav-slot {
        justify-content: flex-start;
      }

      .connected {
        font-size: var(--sl-font-size-small);
        position: absolute;
        top: 3px;
        right: 3px;
      }
      
      @media screen and (max-width: 450px) {
        .mobile {
          flex-direction: column-reverse;
          background-color: yellow;
        }
        .dropdown {
          background-color: pink;
          top: auto;
          bottom: 2rem;
        }
      }
    `
  ];

  private connected_cb() { this.connected = eventbus.connected; }
  private connected_cb_bound = this.connected_cb.bind(this);

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('leaf-connection', this.connected_cb_bound);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('leaf-connection', this.connected_cb_bound);
  }

  render() {
    return html`
      <div class="page ${this.mobile ? 'mobile' : ''}">
        <nav>
          <!-- left icon (go to root) -->
          <div class="leaf-icon">
            <sl-icon @click=${() => app.go("/")} name="leaf-maple"></sl-icon>
          </div>
          <!-- parent nav items -->
          <div class="nav-slot"><slot name="nav"></slot></div>
          <!-- right top menu -->
          <div class="menu">
            <sl-icon name="dots-vertical"></sl-icon>
            <div class="dropdown">
              <sl-menu @click=${e => app.go(e.target.id)}>
                <sl-menu-item id="log">
                  <sl-icon name="math-log"></sl-icon>Log
                </sl-menu-item>
                <sl-menu-item id="settings">
                  <sl-icon name="cog"></sl-icon>Settings
                </sl-menu-item>
                <sl-menu-item id="dev">
                  <sl-icon name="shovel"></sl-icon>Dev
                </sl-menu-item>
                <sl-menu-item id="theme">
                  <sl-icon name="theme-light-dark"></sl-icon>Theme
                </sl-menu-item>
                <sl-menu-item id="scratch2">
                  <sl-icon name="plus"></sl-icon>Scratch 2
                </sl-menu-item>
                <sl-menu-item id="scratch3">
                  <sl-icon name="plus"></sl-icon>Scratch 3
                </sl-menu-item>
              </sl-menu>
            </div>
          </div>
          <sl-icon class="connected" name=${this.connected ? 'wifi' : 'wifi-off'}></sl-icon>
        </nav>
        <!-- page content -->
        <main>
          <slot></slot>
        </main>
      </div>
    `;
  }

}
