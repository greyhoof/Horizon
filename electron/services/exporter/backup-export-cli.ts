import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export interface ExportCliOptions {
  dataDir: string;
  out: string;
  includeGeneral: boolean;
  includeCharacterSettings: boolean;
  includeLogs: boolean;
  includeDrafts: boolean;
  includePinnedConversations: boolean;
  includePinnedEicons: boolean;
  includeRecents: boolean;
  includeHidden: boolean;
  characters?: string[]; // if omitted, auto-detect all characters in dataDir
}

function getCharacters(dataDir: string, filter?: string[]): string[] {
  const list: string[] = [];
  try {
    for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'settings' || entry.name === 'eicons') continue;
      if (entry.name.startsWith('.')) continue;
      list.push(entry.name);
    }
  } catch {}
  list.sort((a, b) => a.localeCompare(b));
  if (!filter || filter.length === 0) return list;
  const set = new Set(filter.map(s => s.toLowerCase()));
  return list.filter(n => set.has(n.toLowerCase()));
}

function listFilesRecursive(rootDir: string): string[] {
  const results: string[] = [];
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir).map(n => path.join(dir, n));
    } catch {
      continue;
    }
    for (const abs of entries) {
      try {
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) stack.push(abs);
        else if (stat.isFile()) results.push(abs);
      } catch {}
    }
  }
  return results;
}

function addCharacterSettings(
  archive: archiver.Archiver,
  characterDir: string,
  character: string,
  opts: ExportCliOptions
): void {
  const settingsDir = path.join(characterDir, 'settings');
  if (!fs.existsSync(settingsDir)) return;

  if (opts.includeCharacterSettings) {
    const files = listFilesRecursive(settingsDir);
    for (const abs of files) {
      const rel = path.relative(settingsDir, abs).replace(/\\/g, '/');
      const zipPath = path.posix.join('characters', character, 'settings', rel);
      archive.file(abs, { name: zipPath });
    }
  } else {
    const includeFiles = new Set<string>();
    if (opts.includePinnedConversations) includeFiles.add('pinned');
    if (opts.includePinnedEicons) includeFiles.add('favoriteEIcons');
    if (opts.includeRecents) {
      includeFiles.add('recent');
      includeFiles.add('recentChannels');
    }
    if (opts.includeHidden) includeFiles.add('hiddenUsers');
    for (const file of Array.from(includeFiles)) {
      const filePath = path.join(settingsDir, file);
      if (fs.existsSync(filePath)) {
        const zipPath = path.posix.join(
          'characters',
          character,
          'settings',
          file
        );
        archive.file(filePath, { name: zipPath });
      }
    }
  }
}

function addCharacterToArchive(
  archive: archiver.Archiver,
  dataDir: string,
  character: string,
  opts: ExportCliOptions
): void {
  const characterDir = path.join(dataDir, character);
  if (!fs.existsSync(characterDir)) return;

  if (opts.includeLogs) {
    const logsDir = path.join(characterDir, 'logs');
    if (fs.existsSync(logsDir)) {
      const files = listFilesRecursive(logsDir);
      for (const abs of files) {
        const rel = path.relative(logsDir, abs).replace(/\\/g, '/');
        const zipPath = path.posix.join('characters', character, 'logs', rel);
        archive.file(abs, { name: zipPath });
      }
    }
  }
  
  if (opts.includeDrafts) {
    const draftsFile = path.join(characterDir, 'drafts.txt');
    if (fs.existsSync(draftsFile)) {
      const zipPath = path.posix.join('characters', character, 'drafts.txt');
      archive.file(draftsFile, { name: zipPath });
    }
  }
  
  addCharacterSettings(archive, characterDir, character, opts);
}

export async function runExportCli(opts: ExportCliOptions): Promise<{
  characters: string[];
  out: string;
}> {
  const dataDir = opts.dataDir;
  if (!dataDir || !fs.existsSync(dataDir))
    throw new Error(`Data directory not found: ${dataDir}`);

  // Create archiver instance
  const archive = archiver('zip', {
    zlib: { level: 6 }
  });

  // Ensure output directory exists
  const outDir = path.dirname(opts.out);
  fs.mkdirSync(outDir, { recursive: true });

  // Create write stream
  const output = fs.createWriteStream(opts.out);
  archive.pipe(output);

  // Add general settings
  if (opts.includeGeneral) {
    const generalSettingsFile = path.join(dataDir, 'settings');
    if (fs.existsSync(generalSettingsFile)) {
      archive.file(generalSettingsFile, { name: 'settings' });
    }
  }

  // Add all characters
  const characters = getCharacters(dataDir, opts.characters);
  for (const c of characters) {
    addCharacterToArchive(archive, dataDir, c, opts);
  }

  // Set up promise before finalizing to ensure we don't miss events
  const result = new Promise<{ characters: string[]; out: string }>(
    (resolve, reject) => {
      output.on('close', () => {
        resolve({ characters, out: opts.out });
      });
      output.on('error', reject);
      archive.on('error', reject);
    }
  );

  // Finalize and wait for completion
  await archive.finalize();

  return result;
}
