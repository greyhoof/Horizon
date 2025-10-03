/**
 * Vanilla F-Chat Importer
 * 
 * Imports data from vanilla F-Chat clients that store data in the fchat directory:
 * - F-Chat Rising
 * - F-Chat 3.0
 * - F-Chat Frolic
 * ? Does Frolic actually use the same folder? I think so. 
 * ? Fatcat pls confirm kthx byes
 */

import * as fs from 'fs';
import * as path from 'path';
import { GeneralSettings } from '../../common';

export type ImportType = 'logs' | 'settings';

export interface VanillaContext {
  readonly baseDir: string;
  readonly dataDir: string;
}

export interface CharacterImportOptions {
  readonly includeLogs?: boolean;
  readonly includeSettings?: boolean;
  readonly includePinnedEicons?: boolean;
  readonly overwrite?: boolean;
  readonly onProgress?: (info: {
    readonly character: string;
    readonly stage: ImportType;
    readonly processed: number;
    readonly total: number;
  }) => void;
}

export interface ImportSummary {
  readonly logsCopied: number;
  readonly logsSkipped: number;
  readonly settingsCopied: number;
  readonly settingsSkipped: number;
}

function getDefaultBaseDir(): string | undefined {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    return appData ? path.join(appData, 'fchat') : undefined;
  }
  const home = process.env.HOME;
  if (!home) return undefined;
  if (process.platform === 'darwin')
    return path.join(home, 'Library', 'Application Support', 'fchat');
  return path.join(home, '.config', 'fchat');
}

export function resolveContext(
  customBaseDir?: string
): VanillaContext | undefined {
  const candidates: Array<{ baseDir: string; dataDir: string }> = [];

  if (customBaseDir) {
    const normalized = path.resolve(customBaseDir);
    candidates.push({
      baseDir: path.dirname(normalized),
      dataDir: normalized
    });
    candidates.push({
      baseDir: normalized,
      dataDir: path.join(normalized, 'data')
    });
  } else {
    const defaultBaseDir = getDefaultBaseDir();
    if (!defaultBaseDir) return undefined;
    const normalized = path.resolve(defaultBaseDir);
    candidates.push({
      baseDir: normalized,
      dataDir: path.join(normalized, 'data')
    });
  }

  for (const candidate of candidates) {
    try {
      const stat = fs.statSync(candidate.dataDir);
      if (!stat.isDirectory()) continue;
      return candidate;
    } catch {
      continue;
    }
  }

  return undefined;
}

export function canImport(context?: VanillaContext): boolean {
  const ctx = context ?? resolveContext();
  if (!ctx) return false;
  return fs.existsSync(path.join(ctx.dataDir, 'settings'));
}

export function listCharacters(context?: VanillaContext): ReadonlyArray<string> {
  const ctx = context ?? resolveContext();
  if (!ctx) return [];
  return fs
    .readdirSync(ctx.dataDir)
    .filter(entry => {
      if (
        entry === 'settings' ||
        entry === 'window.json' ||
        entry === 'eicons.json'
      )
        return false;
      const full = path.join(ctx.dataDir, entry);
      try {
        return fs.statSync(full).isDirectory();
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.localeCompare(b));
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFileIfNeeded(
  source: string,
  destination: string,
  overwrite: boolean
): boolean {
  if (!fs.existsSync(source)) return false;
  if (!overwrite && fs.existsSync(destination)) return false;
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
  return true;
}

function copyDirectory(
  source: string,
  destination: string,
  overwrite: boolean,
  onProgress?: (processed: number, total: number) => void
): { copied: number; skipped: number } {
  if (!fs.existsSync(source)) return { copied: 0, skipped: 0 };
  const entries = fs.readdirSync(source, { withFileTypes: true });
  let processed = 0;
  let copied = 0;
  let skipped = 0;
  const total = entries.length;
  ensureDir(destination);
  for (const entry of entries) {
    const src = path.join(source, entry.name);
    const dest = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      const result = copyDirectory(src, dest, overwrite, onProgress);
      copied += result.copied;
      skipped += result.skipped;
    } else if (entry.isFile()) {
      if (copyFileIfNeeded(src, dest, overwrite)) copied++;
      else skipped++;
    }
    processed++;
    onProgress?.(processed, total);
  }
  return { copied, skipped };
}

export function importGeneralSettings(
  context: VanillaContext,
  destinationDataDir: string
): GeneralSettings | undefined {
  const settingsFile = path.join(context.dataDir, 'settings');
  if (!fs.existsSync(settingsFile)) return undefined;
  try {
    const raw = fs.readFileSync(settingsFile, 'utf8');
    const imported = JSON.parse(raw);
    const result = new GeneralSettings();
    Object.assign(result, imported);
    result.logDirectory = destinationDataDir;
    return result;
  } catch (error) {
    console.error('importGeneralSettings.error', error);
    return undefined;
  }
}

function copyCharacterLogs(
  context: VanillaContext,
  destinationDataDir: string,
  character: string,
  overwrite: boolean,
  onProgress?: (processed: number, total: number) => void
): { copied: number; skipped: number } {
  const source = path.join(context.dataDir, character, 'logs');
  const destination = path.join(destinationDataDir, character, 'logs');
  return copyDirectory(source, destination, overwrite, onProgress);
}

function copyCharacterSettings(
  context: VanillaContext,
  destinationDataDir: string,
  character: string,
  overwrite: boolean,
  onProgress?: (processed: number, total: number) => void
): { copied: number; skipped: number } {
  const source = path.join(context.dataDir, character, 'settings');
  const destination = path.join(destinationDataDir, character, 'settings');
  return copyDirectory(source, destination, overwrite, onProgress);
}

export function importCharacter(
  context: VanillaContext,
  destinationDataDir: string,
  character: string,
  options: CharacterImportOptions = {}
): ImportSummary {
  const includeLogs = options.includeLogs !== false;
  const includeSettings = options.includeSettings !== false;
  const includePinnedEicons =
    options.includePinnedEicons === true ||
    (!includeSettings && options.includePinnedEicons !== false);
  const overwrite = options.overwrite === true;

  let logsCopied = 0;
  let logsSkipped = 0;
  let settingsCopied = 0;
  let settingsSkipped = 0;

  if (includeLogs) {
    const result = copyCharacterLogs(
      context,
      destinationDataDir,
      character,
      overwrite,
      (processed, total) =>
        options.onProgress?.({
          character,
          stage: 'logs',
          processed,
          total
        })
    );
    logsCopied = result.copied;
    logsSkipped = result.skipped;
  }

  if (includeSettings) {
    const result = copyCharacterSettings(
      context,
      destinationDataDir,
      character,
      overwrite,
      (processed, total) =>
        options.onProgress?.({
          character,
          stage: 'settings',
          processed,
          total
        })
    );
    settingsCopied = result.copied;
    settingsSkipped = result.skipped;
  }

  if (
    includePinnedEicons &&
    (!includeSettings || options.includePinnedEicons === true)
  ) {
    const source = path.join(
      context.dataDir,
      character,
      'settings',
      'favoriteEIcons'
    );
    const destination = path.join(
      destinationDataDir,
      character,
      'settings',
      'favoriteEIcons'
    );
    if (fs.existsSync(source)) {
      const copied = copyFileIfNeeded(source, destination, overwrite);
      if (copied) settingsCopied++;
      else if (!overwrite) settingsSkipped++;
    }
  }

  return { logsCopied, logsSkipped, settingsCopied, settingsSkipped };
}

export function importAll(
  context: VanillaContext,
  destinationDataDir: string,
  options: CharacterImportOptions & { characters?: ReadonlyArray<string> } = {}
): Map<string, ImportSummary> {
  const characters = (options.characters ?? listCharacters(context)).slice();
  const summaries = new Map<string, ImportSummary>();
  for (const character of characters) {
    summaries.set(
      character,
      importCharacter(context, destinationDataDir, character, options)
    );
  }
  return summaries;
}
