/** @type {import('vite').UserConfig} */

import { defineConfig } from "vite";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
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
    VitePWA({
      manifest: {
        icons: [
          {
            src: "/icons/leaf-512x512.png", 
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
    }),
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