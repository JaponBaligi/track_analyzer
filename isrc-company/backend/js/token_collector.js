const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const configDir = path.resolve(__dirname, '..', '..', 'config');
const envPath = path.join(configDir, '.env');

function upsertEnvVar(filePath, key, value) {
  let lines = [];
  try {
    lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  } catch (e) {
    lines = [];
  }
  const prefix = `${key}=`;
  const filtered = lines.filter((line) => {
    const t = line.trimStart();
    return t.length > 0 && !t.startsWith(prefix);
  });
  const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  filtered.push(`${key}="${escaped}"`);
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  fs.writeFileSync(filePath, filtered.join('\n') + '\n', { encoding: 'utf8' });
}

let browser;
let page;
let isRunning = true;

async function initializeBrowser() {
  const chrome =
    process.env.CHROME_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    undefined;
  browser = await puppeteer.launch({
    headless: false,
    userDataDir: './chrome_session',
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ],
    ...(chrome ? { executablePath: chrome } : {}),
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
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        upsertEnvVar(envPath, 'SPOTIFY_WEB_AUTHORIZATION', authHeader);
        console.log(`[${new Date().toLocaleTimeString()}] SPOTIFY_WEB_AUTHORIZATION güncellendi -> ${authHeader.slice(0, 20)}... (${envPath})`);
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