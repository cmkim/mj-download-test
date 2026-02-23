# 미드저니 다운로드 툴 사용법

## 🤖 codex 실행 후 다음 프롬프트를 입력
미드저니의 로그인이 풀렸을 경우 재로그인이 필요합니다.   
봇이 설치된 디렉토리로 이동해서 codex를 실행하고 아래의 프롬프트를 사용해서 로그인을 수행합니다.
```
미드저니에서 ace 계정으로 로그인해 줘
미드저니에서 ace 계정으로 로그인되어 있는지 확인해 줘

미드저니에서 art 계정으로 로그인해 줘
미드저니에서 art 계정으로 로그인되어 있는지 확인해 줘
```
ℹ️ 중간에 계속 실행할까요? 하고 물어볼 경우 엔터를 입력하면 넘어갑니다.


## 윈도우에서 스케쥴 등록 테스트
```
$t=(Get-Date).AddMinutes(1); powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\ACE_ART_TEST\project\mj-download-test\windows\register-mj-download.ps1" -Hour $t.Hour -Minute $t.Minute
```


## 프로젝트 최초 설치
윈도우에서는 git bash 환경에서 실행합니다.
1. nodejs 설치
    - fnm 설치 : `curl -fsSL https://fnm.vercel.app/install | bash`
    - nodejs 22 설치 : `fnm i 22`
    - pnpm 활성화 : `sudo corepack enable`
    - pnpm 글로벌 설치 경로 설정 : `pnpm setup`
2. codex 설치
    - 글로벌 설치 : `pnpm i -g @openai/codex`
3. 프로젝트 패키지 설치
    - 패키지 설치 : `pnpm i`


## 프로젝트에 필요한 권한 설정
1. codex 실행 권한 부여
    - codex 실행 후 chatgpt 인증
2. 구글 드라이브 시크릿 키 파일 설치
    - `ace-art-repo-secret.json` 파일을 프로젝트 루트에 복사


## 📋 다운로드 작업을 codex 배치 모드로 실행
```bash
codex exec --dangerously-bypass-approvals-and-sandbox "mj-login 스킬을 사용해서 미드저니에서 ace 계정으로 로그인해 줘"

codex exec --dangerously-bypass-approvals-and-sandbox "mj-download 스킬을 사용해서 미드저니에서 ace 계정의 작업물을 다운로드해 줘"

codex exec --dangerously-bypass-approvals-and-sandbox "art-repo-upload 스킬을 사용해서 미드저니 ace 계정의 작업물을 업로드해 줘"

codex exec --dangerously-bypass-approvals-and-sandbox "미드저니에서 ace 계정의 작업물을 다운로드해서 아트 저장소에 업로드해 줘"

codex exec --dangerously-bypass-approvals-and-sandbox "미드저니에서 art 계정의 작업물을 다운로드해서 아트 저장소에 업로드해 줘"
```

## ⚙️ 요구사항

- **Node.js**: 22.0.0 이상 (필수)
- **pnpm**: 최신 버전 권장 (패키지 관리자)

### Node.js 버전 확인
```bash
node --version  # v22.0.0 이상이어야 함
```

### Node.js 설치/업데이트
- `install-nodejs-22` 스킬 사용 (권장):
  ```bash
  bash .agents/skills/install-nodejs-22/install.sh
  ```
- 또는 [fnm](https://github.com/Schniz/fnm) 으로 직접 설치:
  ```bash
  # fnm 설치
  curl -fsSL https://fnm.vercel.app/install | bash

  # Node.js 22 설치 및 사용
  fnm install 22
  fnm use 22
  ```

### pnpm 설치
```bash
# corepack 활성화 (Node.js 16.9+ 포함)
sudo corepack enable

# pnpm 버전 확인
pnpm --version
```

**참고**: Node.js 22에는 corepack이 기본 포함되어 있어 별도 설치가 불필요합니다.

## 📦 초기 설정

### 1. 의존성 설치
```bash
pnpm install
pnpm exec playwright install chromium
```

또는 install 스크립트 사용:
```bash
pnpm exec tsx .agents/skills/art-repo-package-install/install.ts
```

## 🚀 직접 실행

### TypeScript 스크립트 실행 (pnpm exec tsx 사용)

```bash
# 로그인 상태 확인
pnpm exec tsx .agents/skills/mj-login/check_login.ts ace

# 미드저니 로그인
pnpm exec tsx .agents/skills/mj-login/login.ts ace

# 이미지 다운로드
pnpm exec tsx .agents/skills/mj-download/download.ts ace

# Google Drive 업로드
pnpm exec tsx .agents/skills/art-repo-upload/upload.ts mj mj
```

### pnpm 스크립트 사용

```bash
# 로그인 상태 확인
pnpm mj-check-login ace

# 미드저니 로그인
pnpm mj-login ace

# 이미지 다운로드
pnpm mj-download ace

# Google Drive 업로드
pnpm art-repo-upload
```


## 📂 프로젝트 구조

```
.
├── package.json          # pnpm 의존성 및 스크립트
├── tsconfig.json         # TypeScript 설정
├── .agents/skills/
│   ├── install-nodejs-22/
│   │   └── install.sh       # Node.js 22 + pnpm 설치
│   ├── mj-login/
│   │   ├── check_login.ts   # 로그인 상태 확인
│   │   └── login.ts         # 로그인 실행
│   ├── mj-download/
│   │   └── download.ts      # 이미지 다운로드
│   ├── art-repo-upload/
│   │   └── upload.ts        # Google Drive 업로드
│   └── art-repo-package-install/
│       └── install.ts       # 의존성 설치
├── sessions/             # 로그인 세션 저장
└── downloads/            # 다운로드된 파일
```

## 🔧 기술 스택

- **Node.js 22+** - 최신 JavaScript 런타임
- **TypeScript** - 타입 안전성
- **Playwright** - 브라우저 자동화
- **Google APIs** - Drive 업로드
