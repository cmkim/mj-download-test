/**
 * 미드저니 로그인 세션 유효성 확인
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const HOURS_24_SECONDS = 24 * 60 * 60;

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
}

interface SessionState {
  cookies: Cookie[];
  origins?: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

/**
 * 세션 JSON에 유효한 미드저니 인증 쿠키가 있는지 확인하여 반환한다.
 */
export function checkLogin(accountName: string): boolean {
  const sessionFile = path.join(PROJECT_ROOT, 'sessions', `mj_${accountName}.json`);

  if (!fs.existsSync(sessionFile)) {
    console.log(`[mj_${accountName}] 로그인 정보가 없습니다.`);
    return false;
  }

  let state: SessionState;
  try {
    const fileContent = fs.readFileSync(sessionFile, 'utf-8');
    state = JSON.parse(fileContent);
  } catch (error) {
    console.log(`[mj_${accountName}] 세션 파일을 읽을 수 없습니다.`);
    return false;
  }

  for (const cookie of state.cookies || []) {
    if (!cookie.name.includes('AuthUserToken')) {
      continue;
    }

    const expires = cookie.expires || 0;
    const remaining = expires - Date.now() / 1000;

    if (remaining < HOURS_24_SECONDS) {
      console.log(`[mj_${accountName}] 로그인 정보가 24시간 내에 만료됩니다. 재로그인이 필요합니다.`);
      return false;
    }

    console.log(`[mj_${accountName}] 로그인 정보가 존재합니다.`);
    return true;
  }

  console.log(`[mj_${accountName}] 로그인 정보가 없습니다.`);
  return false;
}

// CLI에서 직접 실행할 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  const accountName = process.argv[2] || 'ace';
  const isValid = checkLogin(accountName);
  process.exit(isValid ? 0 : 1);
}
