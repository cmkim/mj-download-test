/**
 * Google Drive에 백업 파일 업로드
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const KEY_FILE_PATH = path.join(PROJECT_ROOT, 'ace-art-repo-secret.json');
const FOLDER_ID = '1kCbo5CXGcz60VTFVq0vySRexIHC47Fvc';
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const DOWNLOADS_DIR = path.join(PROJECT_ROOT, 'downloads');

/**
 * 인증 후 Google Drive 서비스 객체를 반환한다.
 */
function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * parent_id 아래에 folder_name 폴더를 찾거나 없으면 생성한다. 폴더 ID를 반환한다.
 */
async function findOrCreateFolder(
  service: ReturnType<typeof google.drive>,
  folderName: string,
  parentId: string
): Promise<string> {
  const query = `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const results = await service.files.list({
    q: query,
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

  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const folder = await service.files.create({
    requestBody: folderMetadata,
    fields: 'id',
    supportsAllDrives: true,
  });

  const folderId = folder.data.id!;
  console.log(`폴더 생성 성공! 이름: ${folderName}, ID: ${folderId}`);
  return folderId;
}

/**
 * 폴더 내 기존 파일 이름 목록을 반환한다.
 */
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

    for (const file of results.data.files || []) {
      if (file.name) {
        names.add(file.name);
      }
    }

    pageToken = results.data.nextPageToken || undefined;
  } while (pageToken);

  return names;
}

/**
 * 오늘 날짜가 포함된 백업 zip을 풀어서 yyyy-mm-dd/{driveDir} 폴더에 업로드한다.
 */
export async function uploadBackup(
  localBackupDir: string = 'mj',
  driveDir: string = 'mj'
): Promise<void> {
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

  // yyyy-mm-dd/{driveDir} 폴더 확보
  const dateFolderId = await findOrCreateFolder(service, todayISO, FOLDER_ID);
  const targetFolderId = await findOrCreateFolder(service, driveDir, dateFolderId);

  // 이미 업로드된 파일 이름 조회
  const existingNames = await getExistingFilenames(service, targetFolderId);

  for (const zipPath of zipFiles) {
    console.log(`처리 중: ${path.basename(zipPath)}`);

    // 임시 디렉토리에 압축 해제
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-upload-'));
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tmpDir, true);

      const files = fs.readdirSync(tmpDir).sort();

      for (const fileName of files) {
        const filePath = path.join(tmpDir, fileName);
        const stat = fs.statSync(filePath);

        if (!stat.isFile()) {
          continue;
        }

        if (existingNames.has(fileName)) {
          console.log(`  건너뜀 (이미 존재): ${fileName}`);
          continue;
        }

        const fileMetadata = {
          name: fileName,
          parents: [targetFolderId],
        };

        const media = {
          body: fs.createReadStream(filePath),
        };

        const uploaded = await service.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
          supportsAllDrives: true,
        });

        console.log(`  업로드 완료: ${fileName} (ID: ${uploaded.data.id})`);
      }
    } finally {
      // 임시 디렉토리 정리
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  console.log(`${driveDir} 백업 업로드 완료!`);
}

// CLI에서 직접 실행할 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  const localDir = process.argv[2] || 'mj';
  const driveDir = process.argv[3] || 'mj';
  uploadBackup(localDir, driveDir).then(() => {
    console.log('업로드 작업 완료');
  }).catch((error) => {
    console.error('업로드 중 오류 발생:', error);
    process.exit(1);
  });
}
