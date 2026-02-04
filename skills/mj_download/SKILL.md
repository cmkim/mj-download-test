---
name: mj-download
description: 오늘 생성된 미드저니 이미지를 zip으로 일괄 다운로드합니다.
---

# 미드저니 작업물 다운로드

프로필 세션으로 미드저니 Organize 페이지에 접속하여 오늘 이미지를 zip으로 다운로드한다.

## 사전 조건
- `mj-check-login`으로 로그인 상태를 먼저 확인한다. 로그인 정보가 없으면: `mj-login`을 먼저 실행하라고 안내 후 중단.
- Playwright가 설치되어 있지 않으면: `mj-pip-install`을 먼저 실행하라고 안내 후 중단.

## 함수 시그니처

```python
from skills.mj_download.download import download

download(account_name="mj_account", download_dir="~/Downloads/MJ_Backups")
```

### 파라미터
- `account_name` (str, 필수): 미드저니 계정명 (예: `mj_account`). 프로필은 `login_profile/mj_{account_name}/`에서 읽는다.
- `download_dir` (str, 선택): 다운로드 파일 저장 디렉토리. 기본값 `~/Downloads/MJ_Backups`.

### 결과
- zip 파일이 `download_dir`에 `MJ_Backup_YYYYMMDD.zip` 형식으로 저장된다.

## 동작 흐름
1. Playwright Chromium이 `login_profile/mj_{account_name}/` 세션으로 실행됨
2. `https://www.midjourney.com/organize` 접속
3. "Today" 섹션에서 "Select all" 클릭
4. Bulk Actions Bar의 "Download" 버튼 클릭
5. zip 파일을 `download_dir`에 날짜별 이름으로 저장

## 결과 보고
- 성공 시: 저장된 파일 경로를 사용자에게 알린다.
- "오늘 생성한 이미지가 없습니다" 출력 시: 해당 내용을 전달한다.
- 오류 발생 시: 에러 메시지를 전달하고 원인을 분석한다.
