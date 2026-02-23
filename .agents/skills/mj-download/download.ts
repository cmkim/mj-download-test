/**
 * 미드저니 Organize 페이지에서 오늘 이미지를 일괄 다운로드
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_DOWNLOAD_DIR = path.join(PROJECT_ROOT, 'downloads', 'mj');

/**
 * 날짜별 파일명 생성. 중복 시 (1), (2) 접미사 추가.
 */
function getSavePath(downloadDir: string, accountName: string): string {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const base = path.join(downloadDir, `mj_${accountName}_${today}.zip`);

  if (!fs.existsSync(base)) {
    return base;
  }

  let idx = 1;
  while (true) {
    const p = path.join(downloadDir, `mj_${accountName}_${today}(${idx}).zip`);
    if (!fs.existsSync(p)) {
      return p;
    }
    idx++;
  }
}

/**
 * 세션 JSON으로 미드저니에 접속하여 오늘 이미지를 zip으로 다운로드한다.
 */
export async function download(
  accountName: string,
  downloadDir: string = DEFAULT_DOWNLOAD_DIR
): Promise<boolean> {
  console.log('미드저니 다운로드 스크립트 시작...');

  const sessionFile = path.join(PROJECT_ROOT, 'sessions', `mj_${accountName}.json`);

  if (!fs.existsSync(sessionFile)) {
    console.log(`[오류] 세션 파일이 없습니다: ${sessionFile}`);
    console.log('먼저 로그인을 진행해 주세요.');
    return false;
  }

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-crashpad',
      '--disable-crash-reporter',
      '--disable-gpu',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  let context;
  try {
    context = await browser.newContext({
      storageState: sessionFile,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/131.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    console.log('미드저니 Organize 페이지 접속 중...');
    await page.goto('https://www.midjourney.com/organize', { timeout: 60000 });

    console.log("'Today' 섹션 탐색 중...");
    const todayEl = page.locator('text=Today').first();

    try {
      await todayEl.waitFor({ state: 'visible', timeout: 30000 });
    } catch (error) {
      const screenshotPath = path.join(downloadDir, 'debug_page.png');
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }
      await page.screenshot({ path: screenshotPath });
      console.log(`[디버그] 페이지 스크린샷 저장: ${screenshotPath}`);
      console.log('오늘 생성한 이미지가 없습니다 (No images found for today).');
      return false;
    }

    console.log('이미지 전체 선택 중...');
    const selectBtn = page.locator('button', { hasText: 'Select all' }).first();
    await selectBtn.click({ timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('다운로드 버튼 클릭 중...');
    const downloadBtn = page.locator('button', { hasText: 'Download' }).first();
    await downloadBtn.waitFor({ state: 'visible', timeout: 10000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
    await downloadBtn.click();
    const download = await downloadPromise;

    const savePath = getSavePath(downloadDir, accountName);
    await download.saveAs(savePath);
    console.log(`다운로드 완료: ${savePath}`);
    await page.waitForTimeout(3000);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.log('[오류] 시간 초과 — 페이지 로딩 또는 다운로드가 지연되고 있습니다.');
    } else {
      console.log(`[오류] 실행 중 문제 발생: ${error}`);
    }
    return false;
  } finally {
    if (context) {
      await context.close();
    }
    await browser.close();
  }
}

// CLI에서 직접 실행할 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  const accountName = process.argv[2] || 'ace';
  const downloadDir = process.argv[3] || DEFAULT_DOWNLOAD_DIR;
  download(accountName, downloadDir).then((success) => {
    process.exit(success ? 0 : 1);
  });
}
