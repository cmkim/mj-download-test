# pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

import glob
import mimetypes
import os
import sys
import tempfile
import zipfile
from datetime import date

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# 설정 정보
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
KEY_FILE_PATH = os.path.join(PROJECT_ROOT, "ace-art-repo-secret.json")
FOLDER_ID = "1kCbo5CXGcz60VTFVq0vySRexIHC47Fvc"
SCOPES = ["https://www.googleapis.com/auth/drive"]
DOWNLOADS_DIR = os.path.join(PROJECT_ROOT, "downloads")


def get_drive_service():
    """인증 후 Google Drive 서비스 객체를 반환한다."""
    creds = service_account.Credentials.from_service_account_file(
        KEY_FILE_PATH, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)


def find_or_create_folder(service, folder_name, parent_id):
    """parent_id 아래에 folder_name 폴더를 찾거나 없으면 생성한다. 폴더 ID를 반환한다."""
    query = (
        f"'{parent_id}' in parents"
        f" and name = '{folder_name}'"
        f" and mimeType = 'application/vnd.google-apps.folder'"
        f" and trashed = false"
    )
    results = (
        service.files()
        .list(
            q=query,
            fields="files(id)",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        )
        .execute()
    )
    existing = results.get("files", [])

    if existing:
        folder_id = existing[0]["id"]
        print(f"폴더가 이미 존재합니다. 이름: {folder_name}, ID: {folder_id}")
        return folder_id

    folder_metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
        "parents": [parent_id],
    }
    folder = (
        service.files()
        .create(
            body=folder_metadata,
            fields="id",
            supportsAllDrives=True,
        )
        .execute()
    )
    folder_id = folder.get("id")
    print(f"폴더 생성 성공! 이름: {folder_name}, ID: {folder_id}")
    return folder_id


def get_existing_filenames(service, folder_id):
    """폴더 내 기존 파일 이름 목록을 반환한다."""
    query = (
        f"'{folder_id}' in parents"
        f" and mimeType != 'application/vnd.google-apps.folder'"
        f" and trashed = false"
    )
    names = set()
    page_token = None
    while True:
        results = (
            service.files()
            .list(
                q=query,
                fields="nextPageToken, files(name)",
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
                pageToken=page_token,
            )
            .execute()
        )
        for f in results.get("files", []):
            names.add(f["name"])
        page_token = results.get("nextPageToken")
        if not page_token:
            break
    return names


def upload_backup(local_backup_dir="mj", drive_dir="mj"):
    """오늘 날짜가 포함된 백업 zip을 풀어서 yyyy-mm-dd/{drive_dir} 폴더에 업로드한다."""
    backup_dir = os.path.join(DOWNLOADS_DIR, local_backup_dir)
    today_compact = date.today().strftime("%Y%m%d")
    zip_files = glob.glob(os.path.join(backup_dir, f"*{today_compact}*.zip"))

    if not zip_files:
        print(f"오늘 날짜({today_compact})가 포함된 zip 파일이 없습니다: {backup_dir}")
        return

    service = get_drive_service()

    # yyyy-mm-dd/{drive_dir} 폴더 확보
    date_folder_id = find_or_create_folder(service, date.today().isoformat(), FOLDER_ID)
    target_folder_id = find_or_create_folder(service, drive_dir, date_folder_id)

    # 이미 업로드된 파일 이름 조회
    existing_names = get_existing_filenames(service, target_folder_id)

    for zip_path in zip_files:
        print(f"처리 중: {os.path.basename(zip_path)}")

        with tempfile.TemporaryDirectory() as tmp_dir:
            with zipfile.ZipFile(zip_path, "r") as zf:
                zf.extractall(tmp_dir)

            for file_name in sorted(os.listdir(tmp_dir)):
                file_path = os.path.join(tmp_dir, file_name)
                if not os.path.isfile(file_path):
                    continue

                if file_name in existing_names:
                    print(f"  건너뜀 (이미 존재): {file_name}")
                    continue

                mime_type = (
                    mimetypes.guess_type(file_name)[0] or "application/octet-stream"
                )
                file_metadata = {"name": file_name, "parents": [target_folder_id]}
                media = MediaFileUpload(file_path, mimetype=mime_type)

                uploaded = (
                    service.files()
                    .create(
                        body=file_metadata,
                        media_body=media,
                        fields="id",
                        supportsAllDrives=True,
                    )
                    .execute()
                )
                print(f"  업로드 완료: {file_name} (ID: {uploaded.get('id')})")

    print(f"{drive_dir} 백업 업로드 완료!")


if __name__ == "__main__":
    local_dir = sys.argv[1] if len(sys.argv) > 1 else "mj"
    drive_dir = sys.argv[2] if len(sys.argv) > 2 else "mj"
    upload_backup(local_backup_dir=local_dir, drive_dir=drive_dir)
