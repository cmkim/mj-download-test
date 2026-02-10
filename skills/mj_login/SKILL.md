---
name: mj-login
description: 미드저니 로그인 상태를 확인하고, 필요 시 브라우저를 열어 디스코드 로그인을 진행합니다. 로그인 확인, 로그인, 세션 갱신이 필요할 때 사용합니다.
---

# 미드저니 로그인

## 사전 조건
- Playwright가 설치되어 있지 않으면: `art-repo-pip-install`을 먼저 실행하라고 안내 후 중단.

## 스크립트

| 스크립트 | 역할 |
|----------|------|
| `check_login.py` | 세션 JSON의 인증 쿠키 유효성 확인 |
| `login.py` | 브라우저를 열어 수동 로그인, 세션을 JSON으로 저장 |

## 실행 흐름

### 1단계: 로그인 확인

```python
from skills.mj_login.check_login import check_login

result = check_login(account_name="mj_account")
# True: 로그인 정보 존재 → 사용자에게 알리고 종료
# False: 로그인 정보 없음 → 2단계로 진행
```

### 2단계: 로그인 (1단계에서 False일 때만)

```python
from skills.mj_login.login import login

result = login(account_name="mj_account")
# 브라우저가 열린다. 사용자에게 디스코드 계정으로 로그인하라고 안내한다.
# 로그인 완료 시 (/explore 페이지 이동 감지, 최대 2분) 세션이 sessions/mj_{account_name}.json에 저장된다.
# True: 로그인 성공
# False: 로그인 실패 → 사용자에게 실패 원인을 알리고 중단한다
```

## 파라미터
- `account_name` (str, 필수): 미드저니 계정명. 세션은 `sessions/mj_{account_name}.json`에 저장된다.

## 결과 보고
각 단계의 콘솔 출력을 확인하여 사용자에게 전달한다.
- `[mj_{account_name}] 로그인 정보가 존재합니다.` → 유효한 세션이 있음을 알린다.
- `[mj_{account_name}] 로그인 정보가 저장되었습니다` → 로그인 성공을 알린다.
- `[오류]` → 에러 메시지를 전달하고 원인을 분석한다.
