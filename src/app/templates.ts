import { html } from "lit";

export const text = html`<div>FIRST LINE</div><div>A</div><div>B</div><div>C</div><div>LAST LINE</div>`;

export function text_wide(N: number) { 
  return html`ABC${Array.from(Array(N), (_, i) => html`_text${i}`)}_CBA`;
}

export function text_tall(N: number) {
  return html`<div>FIRST_LINE</div>${Array.from(Array(N), (_, i) => html`<div>Line_${i}</div>`)}<div>LAST_LINE</div>`;

}