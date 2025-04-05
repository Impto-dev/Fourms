import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import workbox from 'workbox-build';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const BUILD_DIR = path.join(__dirname, '../build');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

// Optimization functions
async function optimizeImages() {
  console.log('Optimizing images...');
  
  return imagemin([`${STATIC_DIR}/media/*.{jpg,png,svg}`], {
    destination: `${STATIC_DIR}/media`,
    plugins: [
      imageminMozjpeg({ quality: 80 }),
      imageminPngquant({ quality: [0.6, 0.8] }),
      imageminSvgo({
        plugins: [{ removeViewBox: false }]
      })
    ]
  });
}

async function generateServiceWorker() {
  console.log('Generating service worker...');
  
  return workbox.generateSW({
    swDest: path.join(BUILD_DIR, 'service-worker.js'),
    globDirectory: BUILD_DIR,
    globPatterns: [
      '**/*.{js,css,html,png,jpg,svg,ico}'
    ],
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [{
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }, {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources'
      }
    }, {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutes
        }
      }
    }]
  });
}

function compressAssets() {
  console.log('Compressing assets...');
  const gzipFiles = execSync('gzip -9 -k build/static/**/*.{js,css}', { stdio: 'inherit' });
  const brFiles = execSync('brotli -9 build/static/**/*.{js,css}', { stdio: 'inherit' });
  return { gzipFiles, brFiles };
}

function updateManifest() {
  console.log('Updating manifest...');
  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  manifest.start_url = '/';
  manifest.display = 'standalone';
  manifest.background_color = '#ffffff';
  manifest.theme_color = '#007bff';
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// Main optimization process
async function optimize() {
  try {
    console.log('Starting build optimization...');
    
    // Run optimizations
    await optimizeImages();
    await generateServiceWorker();
    await compressAssets();
    updateManifest();
    
    console.log('Build optimization completed successfully!');
  } catch (error) {
    console.error('Build optimization failed:', error);
    process.exit(1);
  }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimize();
}

export default optimize; 