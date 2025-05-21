import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import https from 'https';

const FFMPEG_CORE_VERSION = '0.12.6';
const CORE_FILES = [
  {
    name: 'ffmpeg-core.js',
    url: `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd/ffmpeg-core.js`
  },
  {
    name: 'ffmpeg-core.wasm',
    url: `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd/ffmpeg-core.wasm`
  }
];

async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const fileStream = createWriteStream(destination);
      pipeline(response, fileStream)
        .then(() => resolve())
        .catch(reject);
    }).on('error', reject);
  });
}

async function main() {
  for (const file of CORE_FILES) {
    console.log(`Downloading ${file.name}...`);
    await downloadFile(file.url, `public/ffmpeg/${file.name}`);
    console.log(`Downloaded ${file.name}`);
  }
}

main().catch(console.error); 