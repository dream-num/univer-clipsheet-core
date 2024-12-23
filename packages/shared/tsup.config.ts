import { defineConfig } from 'tsup';

export default defineConfig({
    treeshake: true,
    format: ['cjs', 'esm'],
    dts: true,
    external: ['@wendellhu/redi', 'chrome', 'react'],
});
