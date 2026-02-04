---
name: mj-check-login
description: 미드저니 로그인 쿠키 파일 존재 여부를 확인합니다.
---

# 미드저니 로그인 쿠키 확인

프로필 디렉토리 내 쿠키 파일 존재 여부를 확인하여 로그인 상태를 판단한다.

## 함수 시그니처

```python
from skills.mj_check_login.check_login import check_login

result = check_login(account_name="mj_account")
# result: True (로그인 정보 존재) / False (로그인 정보 없음)
```

### 파라미터
- `account_name` (str, 필수): 미드저니 계정명 (예: `mj_account`). 프로필은 `login_profile/mj_{account_name}/`에 저장된다.

### 반환값
- `bool`: 쿠키 파일 존재 시 `True`, 없으면 `False`

## 판단 기준
다음 경로 중 하나라도 존재하면 로그인 상태로 판단한다:
- `login_profile/mj_{account_name}/Cookies`
- `login_profile/mj_{account_name}/Default/Cookies`
- `login_profile/mj_{account_name}/Default/Network/Cookies`

## 결과 보고
- `True` 반환 시: 로그인 정보가 존재함을 사용자에게 알린다.
- `False` 반환 시: 로그인 정보가 없으므로 `mj-login`을 실행하라고 안내한다.
