import * as esbuild from 'esbuild';

const config = {
  entryPoints: ['index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: '../dist',
  packages: 'external',
  sourcemap: true,
  minify: false,
  define: {
    'process.env.NODE_ENV': '"production"'
  }
};

esbuild.build(config).catch(() => process.exit(1)); 