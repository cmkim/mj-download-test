/**
 * Playwright, Chromium 브라우저 및 Google API 클라이언트 설치 스크립트
 */

import { execSync } from 'child_process';

function main() {
  console.log('1/3  pnpm 패키지 설치 중...');
  try {
    execSync('pnpm install', { stdio: 'inherit', cwd: process.cwd() });
  } catch (error) {
    console.error('pnpm install 실패:', error);
    process.exit(1);
  }

  console.log('2/3  Chromium 브라우저 설치 중...');
  try {
    execSync('pnpm exec playwright install chromium', { stdio: 'inherit' });
  } catch (error) {
    console.error('Chromium 설치 실패:', error);
    process.exit(1);
  }

  console.log('3/3  설치 완료!');
  console.log('이제 Playwright 기반 스킬을 사용할 수 있습니다.');
}

// CLI에서 직접 실행할 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
