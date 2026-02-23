# [PRD] 미드저니 오늘 결과물 자동 일괄 다운로드 도구

## 1. 개요
Playwright Chromium 전용 프로필(로그인 세션)을 활용하여 미드저니 Organize 페이지에서 오늘 생성한 이미지를 자동으로 일괄 다운로드한다.

- 대상 플랫폼: macOS, Node.js 22+ + TypeScript + Playwright
- 실행 방식: `pnpm exec tsx` (TypeScript 직접 실행)
- 세션 경로: `{프로젝트_루트}/sessions/mj_{계정명}.json`
- 다운로드 경로: `{프로젝트_루트}/downloads/mj` (변경 가능)

## 2. 워크플로
0. **Node.js 환경 구성** — `install-nodejs-22`: Node.js 22 + pnpm 설치 (최초 1회)
1. **환경 준비** — `art-repo-package-install`: Playwright + Chromium + 패키지 설치 (최초 1회)
2. **로그인** — `mj-login(account_name)`: 로그인 확인 → 로그인(필요 시)
3. **다운로드** — `mj-download(account_name, download_dir)`: 로그인 확인 → 로그인(필요 시) → 오늘 이미지 zip 다운로드
4. **업로드** — `art-repo-upload(local_dir, drive_dir)`: 오늘 zip을 구글 드라이브에 업로드

## 3. 파일 구조
```
sessions/
  mj_{계정명}.json               # 로그인 세션 (쿠키, localStorage)
.agents/skills/
  install-nodejs-22/             # Node.js 22 + pnpm 설치
  art-repo-package-install/      # 환경 패키지 설치
  mj-login/                      # 로그인 확인 + 로그인
  mj-download/                   # 오늘 이미지 다운로드
  art-repo-upload/               # 아트 저장소 업로드
```

각 스킬의 상세 사양은 해당 디렉토리의 `SKILL.md`를 참조한다.
