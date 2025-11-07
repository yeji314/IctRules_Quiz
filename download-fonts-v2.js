const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'client', 'fonts');

// 폰트 디렉토리 생성
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Google Fonts Helper에서 가져온 실제 URL
const fonts = [
  {
    url: 'https://github.com/google/fonts/raw/main/apache/pressstart2p/PressStart2P-Regular.ttf',
    filename: 'press-start-2p-v15-latin-regular.woff2'
  }
];

// 파일 다운로드 함수
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
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
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(err);
    });
  });
}

// TTF를 다운로드하고 변환 없이 사용
async function downloadAllFonts() {
  console.log('📥 Press Start 2P 폰트 다운로드 중...\n');

  const ttfDest = path.join(fontsDir, 'PressStart2P-Regular.ttf');

  try {
    console.log(`⬇️  PressStart2P-Regular.ttf 다운로드 중...`);
    await downloadFile(fonts[0].url, ttfDest);
    console.log(`✅ PressStart2P-Regular.ttf 다운로드 완료`);
    console.log('\n🎉 폰트 다운로드 완료!');
    console.log(`📁 폰트 위치: ${fontsDir}`);
  } catch (err) {
    console.error(`❌ 다운로드 실패:`, err.message);
  }
}

downloadAllFonts().catch(console.error);
