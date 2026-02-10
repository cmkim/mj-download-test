---
name: upload-google-drive
description: 로컬 디렉토리의 파일을 구글 드라이브의 특정 디렉토리에 업로드한다. 이미 동일한 파일이 있으면 건너뛴다.
#disable-model-invocation: true
#argument-hint: [local_dir] [drive_dir]
#allowed-tools: Bash(python3 *)
---

## 개요

로컬 디렉토리에 저장된 파일을 구글 드라이브의 지정된 디렉토리에 업로드하는 스킬이다.

## 인자

- `$0` — 로컬 백업 디렉토리명 (`downloads/` 아래 하위 디렉토리, 예: `MJ_Backups`)
- `$1` — 구글 드라이브 대상 폴더명 (예: `mj`)

두 인자 모두 필수이다. 인자가 누락된 경우 아래 기본값 매핑을 참고하여 자동으로 추론한다. 추론할 수 없는 경우에만 사용자에게 물어본다.

## 기본값 매핑

| 키워드 (사용자 요청에 포함된 단어) | local_dir | drive_dir |
|---|---|---|
| 미드저니, midjourney, mj | MJ_Backups | mj |
| suno | Suno_Backups | suno |

## 실행 방법

스킬 디렉토리의 `upload.py`를 직접 호출한다:

```bash
python3 skills/upload_google_drive/upload.py "$0" "$1"
```

## 동작 상세

1. 로컬 디렉토리에서 오늘 날짜(`yyyymmdd`)가 포함된 zip 파일을 찾는다
2. 구글 드라이브에 `yyyy-mm-dd/{drive_dir}` 폴더를 생성한다 (이미 존재하면 재사용)
3. zip을 임시 디렉토리에 압축 해제한다
4. 구글 드라이브 대상 폴더에 이미 같은 이름의 파일이 있으면 건너뛴다
5. 새 파일만 업로드한다

## 사용 예시

```
/upload-google-drive MJ_Backups mj
/upload-google-drive Suno_Backups suno
```
