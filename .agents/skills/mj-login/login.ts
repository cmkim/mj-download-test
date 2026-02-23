/**
 * 미드저니 로그인 — 세션을 JSON으로 저장
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * 브라우저를 열어 미드저니 로그인을 진행하고 세션을 JSON으로 저장한다.
 */
export async function login(accountName: string): Promise<boolean> {
  console.log(`[mj_${accountName}] 브라우저를 열어 로그인을 진행합니다.`);
  console.log('디스코드 계정으로 미드저니에 로그인해 주세요.');

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
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://www.midjourney.com/home', { timeout: 30000 });

    console.log('\n로그인을 완료해 주세요. (최대 2분 대기)');
    const timeoutAt = Date.now() + 120000;
    let isLoggedIn = false;

    while (Date.now() < timeoutAt) {
      const cookies = await context.cookies('https://www.midjourney.com');
      isLoggedIn = cookies.some((cookie) => cookie.name.includes('AuthUserToken'));
      if (isLoggedIn) {
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (!isLoggedIn) {
      throw new Error('LoginNotDetected');
    }

    const sessionDir = path.join(PROJECT_ROOT, 'sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const sessionFile = path.join(sessionDir, `mj_${accountName}.json`);
    await context.storageState({ path: sessionFile });
    console.log(`[mj_${accountName}] 로그인 정보가 저장되었습니다: ${sessionFile}`);
    return true;
  } catch (error) {
    if (
      (error instanceof Error && error.name === 'TimeoutError')
      || (error instanceof Error && error.message === 'LoginNotDetected')
    ) {
      console.log('[오류] 페이지 로딩 시간 초과 — 네트워크 상태를 확인해 주세요.');
    } else {
      console.log(`[오류] 로그인 중 문제 발생: ${error}`);
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
  login(accountName).then((success) => {
    process.exit(success ? 0 : 1);
  });
}
