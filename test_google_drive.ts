/**
 * Google Drive API 테스트
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE_PATH = path.join(__dirname, 'ace-art-repo-secret.json');
const FOLDER_ID = '1kCbo5CXGcz60VTFVq0vySRexIHC47Fvc';
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
  });
  return google.drive({ version: 'v3', auth });
}

/** 텍스트 파일을 생성하여 공유 드라이브에 업로드한다. */
async function testFileUpload() {
  const service = getDriveService();
  const fileName = 'bot_test.txt';
  fs.writeFileSync(fileName, '안녕하세요! 서비스 계정 봇이 업로드한 파일입니다.');

  try {
    const file = await service.files.create({
      requestBody: { name: fileName, parents: [FOLDER_ID] },
      media: { body: fs.createReadStream(fileName) },
      fields: 'id',
      supportsAllDrives: true,
    });
    console.log(`업로드 성공! 파일 ID: ${file.data.id}`);
  } finally {
    fs.unlinkSync(fileName);
  }
}

/** 공유 드라이브 폴더 내 파일 목록을 가져온다. */
async function testListFiles() {
  const service = getDriveService();

  const results = await service.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, modifiedTime)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = results.data.files || [];
  if (files.length === 0) {
    console.log('폴더에 파일이 없습니다.');
    return;
  }

  console.log(`파일 ${files.length}개 발견:`);
  for (const f of files) {
    console.log(`  ${f.name}  (ID: ${f.id}, 크기: ${f.size ?? '-'}, 수정: ${f.modifiedTime})`);
  }
}

/** parent_id 아래에 folder_name 폴더를 찾거나 없으면 생성한다. 폴더 ID를 반환한다. */
async function findOrCreateFolder(
  service: ReturnType<typeof google.drive>,
  folderName: string,
  parentId: string
): Promise<string> {
  const results = await service.files.list({
    q: `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const existing = results.data.files || [];
  if (existing.length > 0) {
    const folderId = existing[0].id!;
    console.log(`폴더가 이미 존재합니다. 이름: ${folderName}, ID: ${folderId}`);
    return folderId;
  }

  const folder = await service.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  const folderId = folder.data.id!;
  console.log(`폴더 생성 성공! 이름: ${folderName}, ID: ${folderId}`);
  return folderId;
}

/** 오늘 날짜(yyyy-mm-dd) 이름의 폴더를 공유 드라이브에 생성한다. 이미 존재하면 재사용한다. */
async function testCreateFolder() {
  const service = getDriveService();
  const today = new Date().toISOString().split('T')[0];
  return findOrCreateFolder(service, today, FOLDER_ID);
}

/** 오늘 날짜(yyyy-mm-dd)/mj 경로의 폴더를 공유 드라이브에 생성한다. */
async function testCreateNestedFolder() {
  const service = getDriveService();
  const today = new Date().toISOString().split('T')[0];
  const dateFolderId = await findOrCreateFolder(service, today, FOLDER_ID);
  return findOrCreateFolder(service, 'mj', dateFolderId);
}

/** 폴더 내 기존 파일 이름 목록을 반환한다. */
async function getExistingFilenames(
  service: ReturnType<typeof google.drive>,
  folderId: string
): Promise<Set<string>> {
  const query = `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
  const names = new Set<string>();
  let pageToken: string | undefined;

  do {
    const results = await service.files.list({
      q: query,
      fields: 'nextPageToken, files(name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken,
    });

    for (const f of results.data.files || []) {
      if (f.name) names.add(f.name);
    }

    pageToken = results.data.nextPageToken || undefined;
  } while (pageToken);

  return names;
}

/** 오늘 날짜가 포함된 백업 zip을 풀어서 yyyy-mm-dd/{driveDir} 폴더에 업로드한다. */
async function testUploadBackup(localBackupDir = 'mj', driveDir = 'mj') {
  const backupDir = path.join(DOWNLOADS_DIR, localBackupDir);
  const today = new Date();
  const todayCompact = today.toISOString().split('T')[0].replace(/-/g, '');
  const todayISO = today.toISOString().split('T')[0];

  const zipFiles = fs
    .readdirSync(backupDir)
    .filter((f) => f.includes(todayCompact) && f.endsWith('.zip'))
    .map((f) => path.join(backupDir, f));

  if (zipFiles.length === 0) {
    console.log(`오늘 날짜(${todayCompact})가 포함된 zip 파일이 없습니다: ${backupDir}`);
    return;
  }

  const service = getDriveService();

  const dateFolderId = await findOrCreateFolder(service, todayISO, FOLDER_ID);
  const targetFolderId = await findOrCreateFolder(service, driveDir, dateFolderId);
  const existingNames = await getExistingFilenames(service, targetFolderId);

  for (const zipPath of zipFiles) {
    console.log(`처리 중: ${path.basename(zipPath)}`);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-upload-'));
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tmpDir, true);

      for (const fileName of fs.readdirSync(tmpDir).sort()) {
        const filePath = path.join(tmpDir, fileName);
        if (!fs.statSync(filePath).isFile()) continue;

        if (existingNames.has(fileName)) {
          console.log(`  건너뜀 (이미 존재): ${fileName}`);
          continue;
        }

        const uploaded = await service.files.create({
          requestBody: { name: fileName, parents: [targetFolderId] },
          media: { body: fs.createReadStream(filePath) },
          fields: 'id',
          supportsAllDrives: true,
        });
        console.log(`  업로드 완료: ${fileName} (ID: ${uploaded.data.id})`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  console.log(`${driveDir} 백업 업로드 완료!`);
}

testListFiles().catch(console.error);
// testUploadBackup().catch(console.error);
