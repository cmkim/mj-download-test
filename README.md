# 미드저니 다운로드 툴 사용법

## codex 실행 후 다음 프롬프트를 입력
```
미드저니에서 ace 계정으로 로그인되어 있는지 확인해 줘
미드저니에서 ace 계정으로 로그인해 줘
미드저니에서 ace 계정의 작업물을 다운로드해 줘
```

## 다운로드 작업을 codex 배치 모드로 실행
```
codex exec --dangerously-bypass-approvals-and-sandbox "mj-login 스킬을 사용해서 미드저니에서 ace 계정으로 로그인해 줘"

codex exec --dangerously-bypass-approvals-and-sandbox "mj-download 스킬을 사용해서 미드저니에서 ace 계정의 작업물을 다운로드해 줘"

codex exec --dangerously-bypass-approvals-and-sandbox "art-repo-upload 스킬을 사용해서 미드저니 ace 계정의 작업물을 업로드해 줘"

codex exec --dangerously-bypass-approvals-and-sandbox "미드저니에서 ace 계정의 작업물을 다운로드해서 아트 저장소에 업로드해 줘"
```
