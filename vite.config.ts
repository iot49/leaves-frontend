/** @type {import('vite').UserConfig} */

import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// const iconsPath = './node_modules/@shoelace-style/shoelace/dist/assets/icons';
const iconsPath = './node_modules/@mdi/svg/svg';

export default defineConfig({
  // messes up path, e.g. move content in ./assets inside ./assets/leaf
  // base: "leaf",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  
  resolve: {
    alias: [
      {
        find: /\/assets\/icons\/(.+)/,
        replacement: `${iconsPath}/$1`,
      },
    ],
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: iconsPath,
          dest: 'assets',
        },
      ],
    }),
  ],
  
});