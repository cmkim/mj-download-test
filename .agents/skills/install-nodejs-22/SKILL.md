---
name: install-nodejs-22
description: fnm, Node.js 22, pnpm을 설치하여 개발 환경을 구성합니다. Windows는 Git Bash 필요.
---

# Node.js 22 환경 자동 설정

`install.sh` 스크립트를 실행하여 fnm, Node.js 22, pnpm을 자동으로 설치한다.

## 사전 요구사항

### macOS/Linux
- curl (기본 설치됨)
- bash (기본 설치됨)

### Windows
- **Git Bash 필요** ([Git for Windows](https://gitforwindows.org/) 설치)
- Git Bash는 Unix 명령어(curl, bash 등) 제공

## Windows PowerShell UTF-8 설정
- PowerShell에서 스킬을 실행할 때 UTF-8 인코딩을 강제한다.
- 프로필에 아래 설정을 넣거나, 실행 스크립트에서 먼저 적용한다. (NoProfile 옵션은 사용하지 않는다)

```powershell
$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8
[Console]::InputEncoding = $utf8
$OutputEncoding = $utf8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['Set-Content:Encoding'] = 'utf8'
$PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8'
```

## CLI 실행

### macOS/Linux
```bash
bash .agents/skills/install-nodejs-22/install.sh
```

### Windows (Git Bash)
```bash
bash .agents/skills/install-nodejs-22/install.sh
```

또는 pnpm 스크립트 사용:
```bash
pnpm install-nodejs-22
```

## 동작 흐름

1. **fnm 확인 및 설치**
   - 이미 설치된 경우: 건너뛰기
   - 미설치 시: curl로 자동 다운로드 및 설치
   - 설치 후: 셸 재로드 안내 및 스크립트 종료

2. **Node.js 22 확인 및 설치**
   - 22 이상이 설치된 경우: 건너뛰기
   - 22 미만 또는 미설치 시: fnm으로 Node.js 22 설치
   - `fnm default 22`로 기본 버전 설정

3. **pnpm 확인 및 활성화**
   - 이미 활성화된 경우: 건너뛰기
   - 미활성화 시:
     - macOS/Linux: `sudo corepack enable` 자동 실행
     - Windows: 관리자 권한으로 `corepack enable` 실행 안내

## 주의사항

### 2단계 실행 필요
fnm이 새로 설치된 경우, 셸 설정 재로드가 필요합니다:

```bash
# 1차 실행 - fnm 설치
bash .agents/skills/install-nodejs-22/install.sh

# 셸 재로드
source ~/.zshrc  # zsh 사용 시
source ~/.bashrc # bash 사용 시

# 또는 터미널 재시작

# 2차 실행 - Node.js 22 및 pnpm 설정
bash .agents/skills/install-nodejs-22/install.sh
```

### sudo 권한
macOS/Linux에서 `corepack enable` 실행 시 sudo 비밀번호 입력이 필요합니다.

### Windows 특이사항
Windows에서는 `corepack enable`을 수동으로 실행해야 합니다:
1. 관리자 권한으로 cmd 또는 PowerShell 실행
2. `corepack enable` 명령 실행

## 설치 확인

```bash
# 설치된 도구 확인
fnm --version
node --version  # v22.x.x
pnpm --version

# 프로젝트에서 테스트
cd /path/to/project
fnm use         # .nvmrc 기반 자동 전환
pnpm install
```

## 특징

- **멱등성**: 여러 번 실행해도 안전
- **스마트 감지**: 이미 설치된 것은 자동으로 건너뛰기
- **상태 표시**: ✓/✗ 아이콘으로 명확한 피드백
- **크로스 플랫폼**: macOS, Linux, Windows(Git Bash) 지원
