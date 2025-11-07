const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'client', 'fonts');

// 폰트 디렉토리 생성
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// 파일 다운로드 함수
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      // 리다이렉트 처리
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`Failed to download: ${response.statusCode} from ${url}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(err);
    });
  });
}

// Google Fonts CSS를 가져와서 실제 폰트 URL 추출
function getFontUrls() {
  return new Promise((resolve, reject) => {
    https.get('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        // CSS에서 url() 추출
        const woff2Match = data.match(/url\((https:\/\/[^)]+\.woff2)\)/);
        const woffMatch = data.match(/url\((https:\/\/[^)]+\.woff)\)/);

        resolve({
          woff2: woff2Match ? woff2Match[1] : null,
          woff: woffMatch ? woffMatch[1] : null
        });
      });
    }).on('error', reject);
  });
}

async function downloadAllFonts() {
  console.log('📥 폰트 파일 다운로드 중...\n');

  try {
    // 1. Press Start 2P 폰트 URL 가져오기
    console.log('🔍 Press Start 2P 폰트 URL 찾는 중...');
    const fontUrls = await getFontUrls();

    if (fontUrls.woff2) {
      const dest = path.join(fontsDir, 'press-start-2p-v15-latin-regular.woff2');
      console.log(`⬇️  press-start-2p-v15-latin-regular.woff2 다운로드 중...`);
      await downloadFile(fontUrls.woff2, dest);
      console.log(`✅ press-start-2p-v15-latin-regular.woff2 다운로드 완료`);
    }

    // 2. DungGeunMo는 이미 다운로드됨
    const dunggeunmoPath = path.join(fontsDir, 'DungGeunMo.woff');
    if (fs.existsSync(dunggeunmoPath)) {
      console.log(`✅ DungGeunMo.woff - 이미 존재함`);
    }

    console.log('\n🎉 모든 폰트 다운로드 완료!');
    console.log(`📁 폰트 위치: ${fontsDir}`);
  } catch (err) {
    console.error('❌ 오류:', err.message);
  }
}

downloadAllFonts().catch(console.error);
