import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function collectRelativeUrls(rootDir: string, currentDir = rootDir): string[] {
  if (!fs.existsSync(currentDir)) return [];
  const urls: string[] = [];
  for (const entry of fs.readdirSync(currentDir, {withFileTypes: true})) {
    const full = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      urls.push(...collectRelativeUrls(rootDir, full));
    } else if (entry.isFile()) {
      const rel = path.relative(rootDir, full).split(path.sep).join('/');
      if (rel === 'sw.js' || rel.endsWith('.map')) continue;
      if (/\.(?:html|js|mjs|css|png|jpg|jpeg|webp|svg|ico|woff2?|webmanifest|json)$/i.test(rel)) {
        urls.push(`/${rel}`);
      }
    }
  }
  return urls;
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." still resolve in production builds,
      // and stamps all built assets into dist/sw.js for full offline pre-caching.
      {
        name: 'copy-assets-and-stamp-sw',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }

          const swPath = path.join(distDir, 'sw.js');
          if (fs.existsSync(swPath)) {
            const urls = collectRelativeUrls(distDir).sort();
            const hash = crypto
              .createHash('sha256')
              .update(urls.join('|'))
              .digest('hex')
              .slice(0, 10);
            const rawSw = fs.readFileSync(swPath, 'utf8');
            const stampedSw = rawSw
              .replace(
                "/*__CACHE_VERSION__*/ 'cheema-coast-v1'",
                JSON.stringify(`cheema-coast-${hash}`),
              )
              .replace('/*__PRECACHE_MANIFEST__*/ []', JSON.stringify(urls, null, 2));
            fs.writeFileSync(swPath, stampedSw, 'utf8');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
