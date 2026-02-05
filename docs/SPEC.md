# 구현 명세

## 공통 사항

- 런타임: Python 3, Playwright (sync API)
- 브라우저: Chromium (`launch()` + `new_context()`)
- 세션 관리: `storage_state` (JSON) — `sessions/mj_{account_name}.json`에 쿠키와 localStorage를 저장
- 봇 감지 우회: `--disable-blink-features=AutomationControlled` (args) + `ignore_default_args=["--enable-automation"]` — Chromium 자동화 지표를 제거하여 Cloudflare 등 봇 탐지를 우회
- User-Agent 오버라이드 (headless 전용): `new_context(user_agent=...)` 에 일반 브라우저 UA를 지정하여 `HeadlessChrome` 식별자 제거
- Crashpad 비활성화: `--disable-crashpad`, `--disable-crash-reporter` — 크래시 리포터를 비활성화하여 macOS에서 "예기치 않게 종료되었습니다" 오류 대화상자가 표시되지 않도록 한다
- GPU 비활성화: `--disable-gpu` — GPU 하위 프로세스가 macOS 윈도우 서버 등록(`_RegisterApplication`) 중 크래시하는 문제를 방지한다. 소프트웨어 렌더링으로 전환됨
- `_PROJECT_ROOT`: 각 스크립트에서 `os.path.dirname()` 체인으로 프로젝트 루트를 계산 (스크립트 위치 → 스킬 디렉토리 → skills → 프로젝트 루트)
- 조기 출력 방어: 함수 진입 직후 `print()` + `sys.stdout.flush()` 로 즉시 출력을 내보내, 호출 측(Codex 등)이 응답 없음으로 판단하여 프로세스를 조기 종료하는 것을 방지

## 스킬

### 디렉토리 구조

```
skills/
  mj_pip_install/          # 환경 설치 스킬
    SKILL.md
    install.py
  mj_download/             # 미드저니 이미지 다운로드 스킬
    SKILL.md
    check_login.py
    login.py
    download.py
```

### `mj-pip-install`

Playwright와 Chromium 브라우저를 설치하는 일회성 환경 설정 스킬.

| 항목 | 내용 |
|------|------|
| 디렉토리 | `skills/mj_pip_install/` |
| 스크립트 | `install.py` |
| 실행 흐름 | `main()` 호출 → pip install → playwright install chromium |
| 완료 후 | `mj-download` 스킬로 이미지를 다운로드할 수 있다고 안내 |

### `mj-download`

로그인 확인 → 로그인(필요 시) → 오늘 이미지 다운로드를 하나의 흐름으로 처리하는 스킬. 세 개의 스크립트를 순서대로 조합하여 목적을 달성한다.

| 항목 | 내용 |
|------|------|
| 디렉토리 | `skills/mj_download/` |
| 스크립트 | `check_login.py`, `login.py`, `download.py` |
| 사전 조건 | Playwright 미설치 시 `mj-pip-install` 안내 후 중단 |

**실행 흐름**

| 단계 | 스크립트 | 함수 호출 | 조건 |
|------|----------|-----------|------|
| 1 | `check_login.py` | `check_login(account_name)` | 항상 실행 |
| 2 | `login.py` | `login(account_name)` | 1단계에서 `False`일 때만 |
| 3 | `download.py` | `download(account_name, download_dir)` | 항상 실행 |

**파라미터**

- `account_name` (str, 필수): 미드저니 계정명. 세션은 `sessions/mj_{account_name}.json`에 저장된다.
- `download_dir` (str, 선택, 3단계만 해당): 다운로드 파일 저장 디렉토리. 기본값 `{_PROJECT_ROOT}/downloads/MJ_Backups`.

## 스크립트

### `skills/mj_pip_install/install.py`

환경 설치 스크립트. 최초 1회 실행.

| 항목 | 내용 |
|------|------|
| 함수 | `main()` |
| 파라미터 | 없음 |
| 동작 | `pip install playwright` → `playwright install chromium` |
| 의존성 | `subprocess`, `sys` (표준 라이브러리만 사용) |

### `skills/mj_download/check_login.py`

세션 JSON 파일에서 미드저니 인증 쿠키의 존재 여부와 유효성을 확인한다.

| 항목 | 내용 |
|------|------|
| 함수 | `check_login(account_name: str) -> bool` |
| 세션 파일 | `sessions/mj_{account_name}.json` |
| 판단 기준 | `AuthUserToken`을 포함하는 쿠키가 존재하고 만료까지 24시간 이상 남아 있으면 `True` |
| 만료 확인 | 쿠키의 `expires` 필드 (Unix 타임스탬프)와 현재 시간을 비교 |
| 에러 처리 | 파일 미존재, JSON 파싱 오류 시 `False` 반환 |

### `skills/mj_download/login.py`

Chromium 브라우저를 열어 사용자가 수동으로 미드저니에 로그인하도록 한다. 로그인 후 세션을 JSON으로 저장한다.

| 항목 | 내용 |
|------|------|
| 함수 | `login(account_name: str)` |
| 동작 | `midjourney.com/home` 페이지를 열고 60초 대기 후 세션 저장 및 브라우저 종료 |
| 세션 저장 | `context.storage_state(path=...)` 로 쿠키와 localStorage를 JSON 파일에 저장 |

### `skills/mj_download/download.py`

미드저니 Organize 페이지에서 오늘 생성된 이미지를 zip으로 다운로드한다.

| 항목 | 내용 |
|------|------|
| 함수 | `download(account_name: str, download_dir: str = DEFAULT_DOWNLOAD_DIR)` |
| 세션 로드 | `browser.new_context(storage_state=session_file)` 로 인증 상태 복원 |
| 기본 다운로드 경로 | `{_PROJECT_ROOT}/downloads/MJ_Backups` |
| 파일명 규칙 | `MJ_Backup_YYYYMMDD.zip`, 중복 시 `(1)`, `(2)` 접미사 |
| 페이지 흐름 | `/organize` 접속 → "Today" `wait_for(state="visible")` (30초) → "Select all" → "Download" 클릭 |
| 디버그 | "Today" 미발견 시 `debug_page.png` 스크린샷을 `download_dir`에 저장 |
| 에러 처리 | context 생성·페이지 조작·다운로드 전 과정을 try 블록으로 감싸며, `PlaywrightTimeout` — 시간 초과, `Exception` — 일반 오류. 모두 콘솔 출력 후 브라우저 종료 |
| 내부 함수 | `_get_save_path(download_dir)` — 날짜별 파일명 생성 및 중복 처리 |
