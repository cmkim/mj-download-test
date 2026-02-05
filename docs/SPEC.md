# 구현 명세

## 공통 사항

- 런타임: Python 3, Playwright (sync API)
- 브라우저: Chromium (`launch_persistent_context`)
- 프로필 경로: `login_profile/mj_{account_name}/`
- 봇 감지 우회 플래그: `--disable-blink-features=AutomationControlled`, `ignore_default_args=["--enable-automation"]`
- Crashpad 비활성화: `--disable-crashpad`, `--disable-crash-reporter` — 크래시 리포터를 비활성화하여 macOS에서 "예기치 않게 종료되었습니다" 오류 대화상자가 표시되지 않도록 한다
- GPU 비활성화: `--disable-gpu` — GPU 하위 프로세스가 macOS 윈도우 서버 등록(`_RegisterApplication`) 중 크래시하는 문제를 방지한다. 소프트웨어 렌더링으로 전환됨
- `_PROJECT_ROOT`: 각 스크립트에서 `os.path.dirname()` 체인으로 프로젝트 루트를 계산 (스크립트 위치 → 스킬 디렉토리 → skills → 프로젝트 루트)

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

- `account_name` (str, 필수): 미드저니 계정명. 프로필은 `login_profile/mj_{account_name}/`에 저장된다.
- `download_dir` (str, 선택, 3단계만 해당): 다운로드 파일 저장 디렉토리. 기본값 `~/Downloads/MJ_Backups`.

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

Chromium 프로필의 Cookies DB에서 미드저니 인증 쿠키의 존재 여부와 유효성을 확인한다.

| 항목 | 내용 |
|------|------|
| 함수 | `check_login(account_name: str) -> bool` |
| 판단 기준 | `%Host-Midjourney.AuthUserToken%` 패턴의 쿠키가 존재하고 만료까지 24시간 이상 남아 있으면 `True` |
| 만료 확인 | `expires_utc` (Chromium 타임스탬프: 1601-01-01 기준 마이크로초)를 Unix 시간으로 변환하여 잔여 시간 계산 |
| DB 접근 | `sqlite3`로 읽기 전용(`?mode=ro`) 열기 |
| 후보 경로 | `{profile}/Cookies`, `{profile}/Default/Cookies`, `{profile}/Default/Network/Cookies` |
| 에러 처리 | `sqlite3.Error` 발생 시 다음 후보 경로로 시도 |

### `skills/mj_download/login.py`

Chromium 브라우저를 열어 사용자가 수동으로 미드저니에 로그인하도록 한다. 로그인 후 세션이 프로필 디렉토리에 저장된다.

| 항목 | 내용 |
|------|------|
| 함수 | `login(account_name: str)` |
| 동작 | `midjourney.com/home` 페이지를 열고 60초 대기 후 브라우저 종료 |
| 세션 저장 | `launch_persistent_context`가 브라우저 종료 시 프로필 디렉토리에 자동 저장 |

### `skills/mj_download/download.py`

미드저니 Organize 페이지에서 오늘 생성된 이미지를 zip으로 다운로드한다.

| 항목 | 내용 |
|------|------|
| 함수 | `download(account_name: str, download_dir: str = DEFAULT_DOWNLOAD_DIR)` |
| 기본 다운로드 경로 | `{_PROJECT_ROOT}/downloads/MJ_Backups` |
| 파일명 규칙 | `MJ_Backup_YYYYMMDD.zip`, 중복 시 `(1)`, `(2)` 접미사 |
| 페이지 흐름 | `/organize` 접속 → "Today" 확인 → "Select all" → "Download" 클릭 |
| 에러 처리 | `PlaywrightTimeout` — 시간 초과, `Exception` — 일반 오류. 모두 콘솔 출력 후 브라우저 종료 |
| 내부 함수 | `_get_save_path(download_dir)` — 날짜별 파일명 생성 및 중복 처리 |
