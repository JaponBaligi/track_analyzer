const puppeteer = require('puppeteer');
const fs = require('fs');
const schedule = require('node-schedule');

let browser;
let page;
let isRunning = true;

async function initializeBrowser() {
  browser = await puppeteer.launch({
    headless: false,
    userDataDir: './chrome_session',
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ],
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  

  
  page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  
  // API isteklerini dinleme
  await page.setRequestInterception(true);
  page.on('request', interceptRequests);
}

function interceptRequests(request) {
  const authHeader = request.headers()['authorization'];
  if (authHeader && authHeader.startsWith('Bearer')) {
    fs.writeFileSync('auth_tokens.txt', authHeader);
    console.log(`[${new Date().toLocaleTimeString()}] Token güncellendi!`);
  }
  request.continue();
}

async function getLatestToken() {
  try {
    if (!page || page.isClosed()) {
      await initializeBrowser();
    }

    await page.goto('https://open.spotify.com', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Sayfayı her seferinde tazele
    await page.reload({ waitUntil: 'networkidle2' });
    
  } catch (error) {
    console.error('Hata oluştu, tarayıcı yeniden başlatılıyor:', error.message);
    await restartBrowser();
  }
}

async function restartBrowser() {
  if (browser) {
    await browser.close();
  }
  await initializeBrowser();
}

// Uygulamayı başlat
(async () => {
  console.log('Spotify Token Collector başlatılıyor...');
  await initializeBrowser();

  // Her 2 dakikada bir token güncelleme
  const job = schedule.scheduleJob('*/2 * * * *', getLatestToken);

  // Hata durumlarında otomatik restart
  process.on('uncaughtException', async (error) => {
    console.error('Kritik hata:', error);
    await restartBrowser();
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    isRunning = false;
    console.log('Uygulama kapatılıyor...');
    job.cancel();
    await browser.close();
    process.exit();
  });

  // İlk çalıştırmayı hemen yap
  await getLatestToken();
})();