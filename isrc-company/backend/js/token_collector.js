const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const tokenPath = path.resolve(__dirname, '..', '..', 'config', 'auth_tokens.txt');

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

  await page.setRequestInterception(true);
  page.on('request', interceptRequests);
}

function interceptRequests(request) {
  try {
    const authHeader = request.headers()['authorization'];
    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        const dir = path.dirname(tokenPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(tokenPath, authHeader, { encoding: 'utf8' });
        console.log(`[${new Date().toLocaleTimeString()}] Token güncellendi -> ${authHeader.slice(0, 20)}... (yazıldı: ${tokenPath})`);
      } catch (err) {
        console.error('Token yazma hatası:', err);
      }
    }
  } catch (e) {
    console.error('Intercept error:', e);
  } finally {
    try { request.continue(); } catch (e) { console.error('request.continue error:', e); }
  }
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

    await page.reload({ waitUntil: 'networkidle2' });

  } catch (error) {
    console.error('Hata oluştu, tarayıcı yeniden başlatılıyor:', error.message);
    await restartBrowser();
  }
}

async function restartBrowser() {
  if (browser) {
    try { await browser.close(); } catch(e) { console.error('close browser error:', e); }
  }
  await initializeBrowser();
}

(async () => {
  console.log('Spotify Token Collector başlatılıyor...');
  await initializeBrowser();
  const job = schedule.scheduleJob('*/2 * * * *', getLatestToken);

  process.on('uncaughtException', async (error) => {
    console.error('Kritik hata:', error);
    await restartBrowser();
  });

  process.on('SIGINT', async () => {
    isRunning = false;
    console.log('Uygulama kapatılıyor...');
    job.cancel();
    try { await browser.close(); } catch(e) { console.error('browser close on SIGINT error:', e); }
    process.exit();
  });
  
  await getLatestToken();
})();