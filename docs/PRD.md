# [PRD] 미드저니 오늘 결과물 자동 일괄 다운로드 도구

## 1. 개요
Playwright Chromium 전용 프로필(로그인 세션)을 활용하여 미드저니 Organize 페이지에서 오늘 생성한 이미지를 자동으로 일괄 다운로드한다.

- 대상 플랫폼: macOS, Python Playwright
- 프로필 경로: `login_profile/mj_{계정명}/`
- 다운로드 경로: `~/Downloads/MJ_Backups` (변경 가능)

## 2. 워크플로
1. **환경 준비** — `mj-pip-install`: Playwright + Chromium 설치
2. **로그인 확인** — `mj-check-login(account_name)`: 쿠키 존재 여부 확인
3. **로그인 실행** — `mj-login(account_name)`: 쿠키가 없을 때 브라우저 로그인
4. **다운로드** — `mj-download(account_name, download_dir)`: 오늘 이미지 zip 다운로드

## 3. 파일 구조
```
login_profile/
  mj_{계정명}/                   # Playwright Chromium 전용 프로필 (자동 생성)
skills/
  mj_pip_install/                # Playwright + Chromium 설치
  mj_check_login/                # 로그인 쿠키 존재 확인
  mj_login/                      # 로그인 실행, 세션 저장
  mj_download/                   # 오늘 이미지 일괄 다운로드
```

각 스킬의 상세 사양은 해당 디렉토리의 `SKILL.md`를 참조한다.
