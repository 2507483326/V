import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const resolve = (p) => {
  return path.resolve(__dirname, p);
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    plugins: [vue()],
    build: {
      lib: {
        entry: "src/index.js",
        name: "V",
        fileName: (format) => `v.${format}.js`,
      },
      rollupOptions: {
        external: ["vue"],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            vue: "Vue",
          },
        },
      }
    },
  });
})
