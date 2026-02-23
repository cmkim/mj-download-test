# 기술 구현 명세

> **문서 구성**: 이 파일은 *어떻게* 구현하는지(How)를 기술한다. 스킬 개요, 실행 흐름, 파라미터 등 *무엇을* 하는지(What)는 [SPEC.md](SPEC.md)를 참조한다.

## 공통 구현 세부사항

- `PROJECT_ROOT`: 각 스크립트에서 `path.resolve(__dirname, '..', '..', '..')` 로 프로젝트 루트를 계산 (스크립트 위치 → 스킬 디렉토리 → skills → .agents → 프로젝트 루트)
- 스킬 디렉토리 레이아웃: 스크립트 파일을 `scripts/` 하위 폴더에 분리하지 않고 SKILL.md와 같은 디렉토리에 배치한다. 스킬당 스크립트가 1~2개로 적어 별도 폴더의 이점이 없고, 플랫 구조가 `import { checkLogin } from '../mj-login/check_login.js'` 형태의 ES 모듈 import를 간결하게 유지한다

### Chromium 실행 옵션

- 봇 감지 우회: `--disable-blink-features=AutomationControlled` (args) + `ignoreDefaultArgs: ['--enable-automation']` — Chromium 자동화 지표를 제거하여 Cloudflare 등 봇 탐지를 우회
- User-Agent 오버라이드 (headless 전용): `newContext({ userAgent: ... })` 에 일반 브라우저 UA를 지정하여 `HeadlessChrome` 식별자 제거
- Crashpad 비활성화: `--disable-crashpad`, `--disable-crash-reporter` — 크래시 리포터를 비활성화하여 macOS에서 "예기치 않게 종료되었습니다" 오류 대화상자가 표시되지 않도록 한다
- GPU 비활성화: `--disable-gpu` — GPU 하위 프로세스가 macOS 윈도우 서버 등록(`_RegisterApplication`) 중 크래시하는 문제를 방지한다. 소프트웨어 렌더링으로 전환됨

## 스크립트

### `.agents/skills/art-repo-package-install/install.ts`

환경 설치 스크립트. 최초 1회 실행.

| 항목 | 내용 |
|------|------|
| 함수 | `main()` |
| 파라미터 | 없음 |
| 동작 | `pnpm install` → `pnpm exec playwright install chromium` |
| 의존성 | `child_process` (Node.js 표준 라이브러리) |
| 실행 방법 | `pnpm exec tsx .agents/skills/art-repo-package-install/install.ts` |

### `.agents/skills/mj-login/check_login.ts`

세션 JSON 파일에서 미드저니 인증 쿠키의 존재 여부와 유효성을 확인한다.

| 항목 | 내용 |
|------|------|
| 함수 | `checkLogin(account_name: string): boolean` |
| 세션 파일 | `sessions/mj_{account_name}.json` |
| 판단 기준 | `AuthUserToken`을 포함하는 쿠키가 존재하고 만료까지 24시간 이상 남아 있으면 `true` |
| 만료 확인 | 쿠키의 `expires` 필드 (Unix 타임스탬프)와 현재 시간(`Date.now() / 1000`)을 비교 |
| 에러 처리 | 파일 미존재, JSON 파싱 오류 시 `false` 반환 |
| 실행 방법 | `pnpm exec tsx .agents/skills/mj-login/check_login.ts ace` |

### `.agents/skills/mj-login/login.ts`

Chromium 브라우저를 열어 사용자가 수동으로 미드저니에 로그인하도록 한다. 로그인 후 세션을 JSON으로 저장한다.

| 항목 | 내용 |
|------|------|
| 함수 | `async login(account_name: string): Promise<boolean>` |
| 동작 | `midjourney.com/home` 페이지를 열고, 로그인 완료 시 (`AuthUserToken` 쿠키 감지, 1초 폴링, 최대 2분) 세션 저장 및 브라우저 종료 |
| 세션 저장 | `await context.storageState({ path: ... })` 로 쿠키와 localStorage를 JSON 파일에 저장 |
| 반환값 | 성공 시 `true`, 실패 시 `false` |
| 에러 처리 | `LoginNotDetected` — 시간 초과, `Error` — 일반 오류. 콘솔 출력 후 `false` 반환 |
| 실행 방법 | `pnpm exec tsx .agents/skills/mj-login/login.ts ace` |

### `.agents/skills/art-repo-upload/upload.ts`

로컬 zip 파일을 압축 해제하여 구글 드라이브 공유 드라이브에 업로드한다.

| 항목 | 내용 |
|------|------|
| 함수 | `export async function uploadBackup(localBackupDir: string = 'mj', driveDir: string = 'mj'): Promise<void>` |
| 입력 | `downloads/{localBackupDir}/` 에서 오늘 날짜(`yyyymmdd`) 포함 zip 파일 탐색 |
| 드라이브 경로 | `yyyy-mm-dd/{driveDir}/` 폴더를 생성 또는 재사용 |
| 중복 처리 | 대상 폴더의 기존 파일명을 조회하여 동일 이름 파일은 건너뜀 |
| 압축 해제 | `AdmZip`으로 임시 디렉토리에 해제 후 업로드, `finally`에서 임시 디렉토리 삭제 |
| 의존성 | `googleapis`, `adm-zip` |
| 에러 처리 | 오류 발생 시 콘솔 출력 후 `process.exit(1)` |
| 실행 방법 | `pnpm exec tsx .agents/skills/art-repo-upload/upload.ts mj mj` |

### `.agents/skills/mj-download/download.ts`

미드저니 Organize 페이지에서 오늘 생성된 이미지를 zip으로 다운로드한다.

| 항목 | 내용 |
|------|------|
| 함수 | `async download(account_name: string, download_dir: string = DEFAULT_DOWNLOAD_DIR): Promise<boolean>` |
| 세션 확인 | 세션 파일 존재 여부를 먼저 확인. 없으면 오류 메시지 출력 후 `false` 반환 |
| 세션 로드 | `await browser.newContext({ storageState: session_file })` 로 인증 상태 복원 |
| 기본 다운로드 경로 | `{PROJECT_ROOT}/downloads/mj` |
| 파일명 규칙 | `mj_{account_name}_YYYYMMDD.zip`, 중복 시 `(1)`, `(2)` 접미사 |
| 페이지 흐름 | `/organize` 접속 → "Today" `waitFor({ state: "visible" })` (30초) → "Select all" → "Download" 클릭 |
| 디버그 | "Today" 미발견 시 `debug_page.png` 스크린샷을 `download_dir`에 저장 |
| 반환값 | 성공 시 `true`, 실패 시 `false` |
| 에러 처리 | context 생성·페이지 조작·다운로드 전 과정을 try 블록으로 감싸며, `TimeoutError` — 시간 초과, `Error` — 일반 오류. 콘솔 출력 후 `false` 반환 |
| 내부 함수 | `getSavePath(download_dir, account_name)` — 날짜별 파일명 생성 및 중복 처리 |
| 실행 방법 | `pnpm exec tsx .agents/skills/mj-download/download.ts ace` |
