# 구현 명세

> **문서 구성**: 이 파일은 *무엇을* 하는지(What)를 기술한다. 함수 시그니처, Chromium 실행 옵션 등 *어떻게* 구현하는지(How)는 [TECH_SPEC.md](TECH_SPEC.md)를 참조한다.

## 공통 사항

- 런타임: Node.js 22+, TypeScript, Playwright (async API)
- 실행 방식: `pnpm exec tsx` (TypeScript 직접 실행, 컴파일 불필요)
- 브라우저: Chromium (`chromium.launch()` + `browser.newContext()`)
- 세션 관리: `storageState` (JSON) — `sessions/mj_{account_name}.json`에 쿠키와 localStorage를 저장
- 스킬 디렉토리 네이밍: 스킬 이름과 디렉토리명 모두 케밥 케이스(`mj-download`)를 사용한다

## 스킬

### 디렉토리 구조

```
.agents/skills/
  install-nodejs-22/       # Node.js 22 + pnpm 설치 스킬
    SKILL.md
    install.sh
  art-repo-package-install/    # 환경 설치 스킬
    SKILL.md
    install.ts
  mj-login/                # 로그인 확인 + 로그인 스킬
    SKILL.md
    check_login.ts
    login.ts
  mj-download/             # 미드저니 이미지 다운로드 스킬
    SKILL.md
    download.ts
  art-repo-upload/         # 아트 저장소 업로드 스킬
    SKILL.md
    upload.ts
```

### `art-repo-package-install`

pnpm 패키지, Playwright, Chromium 브라우저를 설치하는 일회성 환경 설정 스킬.

| 항목 | 내용 |
|------|------|
| 디렉토리 | `.agents/skills/art-repo-package-install/` |
| 스크립트 | `install.ts` |
| 실행 흐름 | `main()` 호출 → pnpm install → pnpm exec playwright install chromium |
| 완료 후 | Playwright 기반 스킬을 사용할 수 있다고 안내 |

### `mj-login`

로그인 상태를 확인하고, 필요 시 브라우저를 열어 디스코드 로그인을 진행하는 스킬.

| 항목 | 내용 |
|------|------|
| 디렉토리 | `.agents/skills/mj-login/` |
| 스크립트 | `check_login.ts`, `login.ts` |
| 사전 조건 | Playwright 미설치 시 `art-repo-package-install` 안내 후 중단 |

**실행 흐름**

| 단계 | 스크립트 | 함수 호출 | 조건 |
|------|----------|-----------|------|
| 1 | `check_login.ts` | `checkLogin(account_name)` | 항상 실행 |
| 2 | `login.ts` | `await login(account_name)` | 1단계에서 `false`일 때만 |

**파라미터**

- `account_name` (string, 필수): 미드저니 계정명. 세션은 `sessions/mj_{account_name}.json`에 저장된다.

### `mj-download`

로그인 확인 → 로그인(필요 시) → 오늘 이미지 다운로드를 하나의 흐름으로 처리하는 스킬. `mj-login` 스킬의 스크립트와 자체 다운로드 스크립트를 순서대로 조합하여 목적을 달성한다.

| 항목 | 내용 |
|------|------|
| 디렉토리 | `.agents/skills/mj-download/` |
| 스크립트 | `download.ts` (로그인은 에이전트가 `mj-login` 스킬을 별도 호출) |
| 사전 조건 | Playwright 미설치 시 `art-repo-package-install` 안내 후 중단 |

**실행 흐름**

| 단계 | 스크립트 | 함수 호출 | 조건 |
|------|----------|-----------|------|
| 1 | `mj-login/check_login.ts` | `checkLogin(account_name)` | 항상 실행 |
| 2 | `mj-login/login.ts` | `await login(account_name)` | 1단계에서 `false`일 때만. 실패 시 중단 |
| 3 | `download.ts` | `await download(account_name, download_dir)` | 1~2단계 성공 시 실행 |

**파라미터**

- `account_name` (string, 필수): 미드저니 계정명. 세션은 `sessions/mj_{account_name}.json`에 저장된다.
- `download_dir` (string, 선택, 3단계만 해당): 다운로드 파일 저장 디렉토리. 기본값 `{PROJECT_ROOT}/downloads/mj`.

### `art-repo-upload`

로컬 `downloads/` 디렉토리의 오늘 날짜 zip 파일을 구글 드라이브 아트 저장소에 업로드하는 스킬.

| 항목 | 내용 |
|------|------|
| 디렉토리 | `.agents/skills/art-repo-upload/` |
| 스크립트 | `upload.ts` |
| 사전 조건 | 서비스 계정 키 파일(`ace-art-repo-secret.json`)이 프로젝트 루트에 존재해야 함 |

**파라미터**

- `local_dir` (string, 필수): 로컬 백업 디렉토리명 (`downloads/` 하위, 예: `mj`)
- `drive_dir` (string, 필수): 구글 드라이브 대상 폴더명 (예: `mj`)

세부 구현은 [TECH_SPEC.md](TECH_SPEC.md)를 참조한다.
