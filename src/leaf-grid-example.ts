import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('leaf-grid-example')
export class LeafGridExample extends LitElement {

    static styles = css`
        :host {
            display: grid;
            grid-template-columns: 100px auto 50px;
            grid-template-rows: 30px auto 50px;
            column-gap: 2px;
            row-gap: 2px;
            height: 100vh;
        }
        header {
            grid-column: 1/4;
        }
        article {
            grid-auto-flow: column;
            overflow-y: auto;
            padding: 10px;
        }
        footer {
            grid-column: 1/4;
        }
        header, footer, article, aside {
            border: 1px black dotted;
        }
    `

    render() {
        return html`
            
                <header>Header</header>
                <aside>Side bar b</aside>
                <article><div>ArticleArticleArticleArticleArticleArticleArticleArticleArticleArticle 2023-10-08T23:49:28 ERROR app.main: ***** global asyncio exception:
                2023-10-08T23:49:28 ERROR app.main: Traceback (most recent call last):
  File "asyncio/core.py", line 1, in run_until_complete
  File "features/webserver.py", line 28, in _main
  File "features/wifi.py", line 83, in __aenter__
WifiException: Failed connecting to R 2023-10-08T23:49:28 ERROR app.main: ***** global asyncio exception:
2023-10-08T23:49:28 ERROR app.main: Traceback (most recent call last):
  File "asyncio/core.py", line 1, in run_until_complete
  File "features/webserver.py", line 28, in _main
  File "features/wifi.py", line 83, in __aenter__
WifiException: Failed connecting to R 2023-10-08T23:49:28 ERROR app.main: ***** global asyncio exception:
                </div></article>
                <aside>Side bar d</aside>
                <footer>Footer</footer>
        `
    }
    
}
