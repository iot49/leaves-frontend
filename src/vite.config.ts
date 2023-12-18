/** @type {import('vite').UserConfig} */

import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    // does not work (ignored)
    base: "/leaf/",
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
            },
        },
    },
});