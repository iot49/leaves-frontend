import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';


@customElement('leaf-router')
export class LeafRouter extends LitElement {

  @property({ attribute: false })
  private routes = [];

  @state()
  private route = "dev"; //"view";

  constructor() {
    super();
    window.addEventListener('go', (event: CustomEvent)  => this.go(event.detail.location));
  }

  protected go(location="/") {
    this.route = location.match(/\/?([\w\d-]*)/)[1];
  }

  render() {
    const target = this.routes.find(item => item.route === this.route) || this.routes[0];

    if (!("element" in target)) {
      target.element = document.createElement(target.component);
      this.routes = [...this.routes];
    }

    return html`${target.element}`
  }

}
