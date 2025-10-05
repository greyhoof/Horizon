import * as remote from '@electron/remote';
import fs from 'fs';
import { ipcRenderer } from 'electron';
import l from '../../../chat/localize';
import * as VanillaImporter from './vanilla-importer';
import { SlimcatImporter } from '../index';
import { GeneralSettings } from '../../common';

/**
 * Startup auto-import handler used by chat.ts to process an import hint from the URL query.
 * Supports:
 *  - 'auto': prefer Vanilla when context is found, otherwise Slimcat (if available)
 *  - 'vanilla': show prompt and import general + defaults on confirm, or open advanced UI
 *  - 'slimcat': prompt and import general
 * Note: respects settings.hasDismissedVanillaImport to avoid prompting again for Vanilla.
 */
type ImporterHint = 'auto' | 'vanilla' | 'advanced' | 'slimcat' | undefined;

function normalizeImportHint(v: string | undefined): ImporterHint {
  if (v === 'true') return 'slimcat';
  if (v === 'auto' || v === 'vanilla' || v === 'slimcat' || v === 'advanced')
    return v;
  return undefined;
}

function getFinalHint(
  rawHint: ImporterHint,
  ctx: any,
  canImportSlimcat: boolean
): 'vanilla' | 'slimcat' | undefined {
  if (rawHint === 'auto') {
    if (ctx) return 'vanilla';
    if (canImportSlimcat) return 'slimcat';
    return undefined;
  }
  if (rawHint === 'vanilla' || rawHint === 'slimcat') return rawHint;
  return undefined;
}

function doVanillaGeneralImport(
  rctx: NonNullable<ReturnType<typeof VanillaImporter.resolveContext>>,
  settings: GeneralSettings
): GeneralSettings {
  const destinationDir = settings.logDirectory;
  fs.mkdirSync(destinationDir, { recursive: true });

  const importedSettings = VanillaImporter.importGeneralSettings(
    rctx,
    destinationDir
  );
  if (importedSettings)
    settings = Object.assign(new GeneralSettings(), settings, importedSettings);

  const summaries = VanillaImporter.importAll(rctx, destinationDir, {
    includePinnedEicons: true
  });
  const importedCharacters = Array.from(summaries.entries()).filter(
    ([, s]) => s.logsCopied > 0 || s.settingsCopied > 0
  );

  settings.hasImportedVanillaLogs = true;
  settings.version = remote.app.getVersion();
  ipcRenderer.send('general-settings-update', settings);
  ipcRenderer.send(
    'save-login',
    settings.account,
    settings.host,
    settings.proxy
  );

  if (importedCharacters.length > 0) {
    alert(
      l(
        'importer.vanillaSuccess',
        importedCharacters.length.toString(),
        importedCharacters.map(([n]) => n).join(', ')
      )
    );
  } else {
    alert(l('importer.vanillaNoData'));
  }
  return settings;
}

function handleVanillaImportPrompt(
  ctx: NonNullable<ReturnType<typeof VanillaImporter.resolveContext>>,
  settings: GeneralSettings
): GeneralSettings {
  const choice = remote.dialog.showMessageBoxSync({
    message: l('importer.vanillaImportGeneral'),
    title: l('title'),
    type: 'question',
    buttons: [l('confirmYes'), l('importer.vanillaAdvanced'), l('confirmNo')],
    defaultId: 0,
    cancelId: 2
  });

  if (choice === 1) {
    ipcRenderer.send('open-exporter-window', 'vanilla');
  } else if (choice === 0) {
    return doVanillaGeneralImport(ctx, settings);
  } else {
    settings.hasDismissedVanillaImport = true;
    ipcRenderer.send('general-settings-update', settings);
  }
  return settings;
}

function handleSlimcatImport(settings: GeneralSettings): void {
  if (
    SlimcatImporter.canImportGeneral() &&
    confirm(l('importer.importGeneral'))
  ) {
    SlimcatImporter.importGeneral(settings);
    ipcRenderer.send('save-login', settings.account, settings.host);
  }
}

export async function handleStartupImport(
  settings: GeneralSettings,
  rawImportParam: string | undefined
): Promise<GeneralSettings> {
  const rawHint = normalizeImportHint(rawImportParam);
  if (!rawHint) return settings;

  try {
    const ctx =
      rawHint === 'auto' || rawHint === 'vanilla'
        ? VanillaImporter.resolveContext(settings.vanillaCustomBaseDir)
        : undefined;

    const finalHint = getFinalHint(
      rawHint,
      ctx,
      SlimcatImporter.canImportGeneral()
    );

    if (!finalHint) return settings;
    if (finalHint === 'vanilla' && settings.hasDismissedVanillaImport)
      return settings;

    if (finalHint === 'vanilla' && ctx) {
      settings = handleVanillaImportPrompt(ctx, settings);
    } else if (finalHint === 'slimcat') {
      handleSlimcatImport(settings);
    }
  } catch (err) {
    console.error('importer.error', err);
    alert(l('importer.error'));
  }

  return settings;
}
