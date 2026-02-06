---
name: mj-download
description: 미드저니 오늘 이미지를 zip으로 일괄 다운로드합니다.
---

# 미드저니 작업물 다운로드

## 사전 조건
- Playwright가 설치되어 있지 않으면: `mj-pip-install`을 먼저 실행하라고 안내 후 중단.

## 스크립트

| 스크립트 | 역할 |
|----------|------|
| `check_login.py` | 세션 JSON의 인증 쿠키 유효성 확인 |
| `login.py` | 브라우저를 열어 수동 로그인, 세션을 JSON으로 저장 |
| `download.py` | 세션 JSON으로 인증하여 오늘 이미지를 zip으로 다운로드 |

## 실행 흐름

### 1단계: 로그인 확인

```python
from skills.mj_download.check_login import check_login

result = check_login(account_name="mj_account")
# True: 로그인 정보 존재 → 3단계로 진행
# False: 로그인 정보 없음 → 2단계로 진행
```

### 2단계: 로그인 (1단계에서 False일 때만)

```python
from skills.mj_download.login import login

result = login(account_name="mj_account")
# 브라우저가 열린다. 사용자에게 디스코드 계정으로 로그인하라고 안내한다.
# 로그인 완료 시 (/explore 페이지 이동 감지, 최대 2분) 세션이 sessions/mj_{account_name}.json에 저장된다.
# True: 로그인 성공
# False: 로그인 실패 (시간 초과 등)
```

### 3단계: 다운로드

```python
from skills.mj_download.download import download

result = download(account_name="mj_account", download_dir="./downloads/MJ_Backups")
# download_dir 기본값: ./downloads/MJ_Backups
# True: 다운로드 성공
# False: 다운로드 실패 (세션 파일 없음, 오늘 이미지 없음, 시간 초과 등)
```

## 파라미터 (공통)
- `account_name` (str, 필수): 미드저니 계정명. 세션은 `sessions/mj_{account_name}.json`에 저장된다.
- `download_dir` (str, 선택, download만 해당): 다운로드 파일 저장 디렉토리. 기본값 `./downloads/MJ_Backups`.

## 결과 보고
각 단계의 콘솔 출력을 확인하여 사용자에게 전달한다.
- `다운로드 완료: {경로}` → 저장된 파일 경로를 알린다.
- `오늘 생성한 이미지가 없습니다` → 해당 내용을 전달한다.
- `[오류]` → 에러 메시지를 전달하고 원인을 분석한다.
