---
name: art-repo-package-install
description: npm 패키지, Playwright, Chromium 브라우저를 설치합니다. 최초 환경 설정 시 사용합니다.
---

# 환경 패키지 설치

`install.ts`를 실행하여 npm 패키지, Playwright, Chromium 브라우저를 설치한다.

## Windows PowerShell UTF-8 설정
- PowerShell에서 스킬을 실행할 때 UTF-8 인코딩을 강제한다.
- 프로필에 아래 설정을 넣거나, 실행 스크립트에서 먼저 적용한다. (NoProfile 옵션은 사용하지 않는다)

```powershell
chcp 65001 > $null
[Console]::InputEncoding  = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding           = [System.Text.UTF8Encoding]::new($false)
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
```

## CLI 실행

```bash
pnpm exec tsx .agents/skills/art-repo-package-install/install.ts
# 샌드박스 환경(codex 인터랙티브)에서 IPC 소켓 오류 발생 시:
node --import tsx/esm .agents/skills/art-repo-package-install/install.ts
```

또는 pnpm 스크립트 사용:
```bash
pnpm install-deps
```

또는 직접 설치:
```bash
pnpm install
pnpm exec playwright install chromium
```

## 동작 흐름
1. `pnpm install` — package.json에 정의된 모든 패키지 설치
2. `pnpm exec playwright install chromium` — Chromium 브라우저 설치

## 설치되는 패키지
- `playwright` — 브라우저 자동화
- `googleapis` — Google Drive API 클라이언트
- `adm-zip` — ZIP 파일 처리
- `tsx` — TypeScript 직접 실행
- `typescript` — TypeScript 컴파일러
- `@types/node` — Node.js 타입 정의

## 결과 보고
- 각 단계의 성공/실패를 사용자에게 보고한다.
- 설치가 모두 완료되면 Playwright 기반 스킬을 사용할 수 있다고 안내한다.
