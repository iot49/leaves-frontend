import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { type IEventBus, eventbusContext } from './app/contexts';

@customElement('leaf-page')
export class LeafPage extends LitElement {

  @property({ type: Boolean })
  mobile: boolean;

  @consume({ context: eventbusContext, subscribe: false })
  @property({ attribute: false })
  private eventbus: IEventBus;

  static styles = [
    css`
      a { text-decoration: none; }
      .page {
        height: 100vh;
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
            <a href="/">
              <kor-icon icon="favorite" color="var(--text-4)" size="m"></kor-icon>
            </a>
          </div>
          <div class="nav-slot"><slot name="nav"></slot></div>
          <div class="menu">
            <kor-icon icon="more_vert" color="var(--text-4)"></kor-icon>
            <div class="dropdown">
              <a href="/connect">
                <kor-menu-item 
                  icon="sync_alt" 
                  label=${this.eventbus.connected ? 'Disconnect' : 'Connect'}>
                </kor-menu-item>
              </a>
              <a href="/log">
                <kor-menu-item 
                  icon="cabin" label="Log" 
                  ?disabled=${!this.eventbus.connected}>
                </kor-menu-item>
              </a>
              <a href="/settings">
                <kor-menu-item 
                  icon="settings" label="Settings"
                  ?disabled=${!this.eventbus.connected}>
                </kor-menu-item>
              </a>
              <a href="/editor">
                <kor-menu-item 
                  icon="edit" label="Editor">
                </kor-menu-item>
              </a>
              <a href="/dev">
                <kor-menu-item 
                  icon="construction" label="Dev">
                  ?disabled=${!this.eventbus.connected}>
                </kor-menu-item>
              </a>
              <a href="/scratch">
                <kor-menu-item 
                  icon="bolt" label="Scratch">
                </kor-menu-item>
              </a>
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
