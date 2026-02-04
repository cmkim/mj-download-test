---
name: mj-login
description: 미드저니 로그인을 실행하여 프로필 디렉토리에 세션을 저장합니다.
---

# 미드저니 로그인 실행

브라우저를 열어 미드저니 로그인을 진행하고 프로필 디렉토리에 세션을 저장한다.

## 사전 조건
- Playwright가 설치되어 있지 않으면: `mj-pip-install`을 먼저 실행하라고 안내 후 중단.

## 함수 시그니처

```python
from skills.mj_login.login import login

login(account_name="mj_account")
```

### 파라미터
- `account_name` (str, 필수): 미드저니 계정명 (예: `mj_account`). 프로필은 `login_profile/mj_{account_name}/`에 저장된다.

### 결과
- `login_profile/mj_{account_name}/`에 로그인 정보(쿠키, 세션)가 저장된다.

## 실행 후 안내
사용자에게 다음을 알린다:
1. 브라우저가 열리면 디스코드 계정으로 미드저니에 로그인할 것
2. 로그인 완료 후 브라우저 창을 닫으면 세션이 자동 저장됨
3. 이후 `mj-download`로 오늘 이미지를 일괄 다운로드할 수 있음
