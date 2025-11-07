const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'client', 'fonts');

// 폰트 디렉토리 생성
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// 다운로드할 폰트 파일들
const fonts = [
  {
    url: 'https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81PsI.woff2',
    filename: 'press-start-2p-v15-latin-regular.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nRivNm4Ic.woff',
    filename: 'press-start-2p-v15-latin-regular.woff'
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff',
    filename: 'DungGeunMo.woff'
  }
];

// 파일 다운로드 함수
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    protocol.get(url, (response) => {
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
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

// 모든 폰트 다운로드
async function downloadAllFonts() {
  console.log('📥 폰트 파일 다운로드 중...\n');

  for (const font of fonts) {
    const dest = path.join(fontsDir, font.filename);

    // 이미 파일이 있으면 스킵
    if (fs.existsSync(dest)) {
      console.log(`✅ ${font.filename} - 이미 존재함`);
      continue;
    }

    try {
      console.log(`⬇️  ${font.filename} 다운로드 중...`);
      await downloadFile(font.url, dest);
      console.log(`✅ ${font.filename} 다운로드 완료`);
    } catch (err) {
      console.error(`❌ ${font.filename} 다운로드 실패:`, err.message);
    }
  }

  console.log('\n🎉 모든 폰트 다운로드 완료!');
  console.log(`📁 폰트 위치: ${fontsDir}`);
}

downloadAllFonts().catch(console.error);
