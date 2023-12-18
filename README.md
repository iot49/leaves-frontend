# Leaves

## Build

```
npm run dev
npm run build
```

## CSS

* https://daveceddia.com/implement-a-design-with-css/

## Editor

* [Monaco](https://github.com/rodydavis/lit-monaco-editor)
* [Monaco](https://github.com/rodydavis/lit-code-editor)
* [Monaco small](https://github.com/microsoft/monaco-editor/tree/main/samples/browser-esm-webpack-small)
* [Yaml](https://github.com/remcohaszing/monaco-yaml)

* Editor
  * [Ace, CodeMirror, Monaco (vscode)](https://blog.replit.com/code-editors)
  * [CodeMirror](https://codemirror.net/)
    * [LitElement + CodeMirror](https://codepen.io/alangdm/pen/yjKEBO)
    * [Users (incl Chrome Devtools)](https://codemirror.net/5/doc/realworld.html)
  * [Monaco](https://rodydavis.com/posts/lit-monaco-editor/)


## Lit

* [Awesome Lit](https://github.com/web-padawan/awesome-lit)
* [Docs](https://lit.dev/)
* [Vite](https://vitejs.dev/)
  * `npm run dev`
* [Getting Started (w/ Vite)](https://levelup.gitconnected.com/getting-started-with-web-components-lit-part-2-3cd878aeca73)

### Components

* [kor](https://kor-ui.com/introduction/welcome)
* [vadiin](https://vaadin.com/)
* [chart.js](https://www.chartjs.org/)
  * [lit chart](https://stackblitz.com/edit/lit-element-chartjs-dtrcwz?file=index.js)

* lovelace
  * [ha-gauge](https://github.com/home-assistant/frontend/blob/dev/src/components/ha-gauge.ts)

## PWA

* [Building PWAs with lit-element](https://medium.com/pwabuilder/building-pwas-with-web-components-33f986bf8e4c)
* [service-worker](https://developer.chrome.com/docs/workbox/service-worker-overview/)

## Encryption

* [https on internal network](https://security.stackexchange.com/questions/121163/how-do-i-run-proper-https-on-an-internal-network)



* Connector - root
  * connect/disconnect
  * connection status cb
  * event_bus: cb, post
  * post used in entities, rest is local
  

* State - context
  * updated by event_bus cb
  * changes frequently
  * used everywhere
  * provides state, post

* App - context
  * Views
  * Config
  * changes rarely