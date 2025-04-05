const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const BUILD_DIR = path.join(__dirname, '../build');
const STATIC_DIR = path.join(BUILD_DIR, 'static');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Optimization functions
async function optimizeImages() {
  console.log('Optimizing images...');
  
  // Dynamic imports for ES modules
  const imagemin = (await import('imagemin')).default;
  const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;
  const imageminPngquant = (await import('imagemin-pngquant')).default;
  const imageminSvgo = (await import('imagemin-svgo')).default;
  
  const imageFiles = await imagemin([`${PUBLIC_DIR}/**/*.{jpg,jpeg,png,svg}`], {
    destination: `${BUILD_DIR}/static/media`,
    plugins: [
      imageminMozjpeg({ quality: 80 }),
      imageminPngquant({ quality: [0.6, 0.8] }),
      imageminSvgo({
        plugins: [
          { removeViewBox: false },
          { cleanupIDs: false }
        ]
      })
    ]
  });

  console.log(`Optimized ${imageFiles.length} images`);
}

async function generateServiceWorker() {
  console.log('Generating service worker...');
  
  // Dynamic import for workbox-build
  const { generateSW } = await import('workbox-build');
  
  const { count, size } = await generateSW({
    swDest: `${BUILD_DIR}/service-worker.js`,
    globDirectory: BUILD_DIR,
    globPatterns: [
      '**/*.{js,css,html,png,jpg,jpeg,svg,gif,ico,json}'
    ],
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      },
      {
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources'
        }
      }
    ]
  });

  console.log(`Generated service worker with ${count} files, totaling ${(size / 1024 / 1024).toFixed(2)} MB.`);
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
if (require.main === module) {
  optimize();
}

module.exports = optimize; 