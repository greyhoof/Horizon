import { Cache } from './cache';
import { getDrafts, saveDrafts } from '../electron/filesystem';
import log from 'electron-log';
import core from '../chat/core';

export interface ConversationCachedMessage {
  channel: string;
  message: string;
}

export class ConversationDraftRecord {
  channel: string;
  message: string;

  constructor(channel: string, message?: string) {
    this.channel = channel;
    this.message = message || '';
  }
}

export class ConversationDraftCache extends Cache<ConversationDraftRecord> {
  private lastCacheSave = Date.now();
  private cacheAlreadyLoaded = false;
  private useCache = false;
  private diskSaveTimerInSeconds = 60;

  async loadCache(): Promise<void> {
    if (!core.connection.character || this.cacheAlreadyLoaded) return;

    const settings = await core.settingsStore.get('settings');
    this.useCache = settings?.horizonCacheDraftMessages || this.useCache;
    this.diskSaveTimerInSeconds =
      settings?.horizonSaveDraftMessagesToDiskTimer ||
      this.diskSaveTimerInSeconds;

    if (!this.useCache) {
      this.cacheAlreadyLoaded = true;
      return;
    }

    // Check possible accidents from the user (mostly a backup check in case the setting somehow gets set to e.g. 0)
    if (this.diskSaveTimerInSeconds < 5) this.diskSaveTimerInSeconds = 5;

    const drafts = getDrafts();
    this.cache = drafts || {};
    log.info('Drafts loaded, if any');

    this.cacheAlreadyLoaded = true;
    setInterval(
      () => this.saveCacheToDisk(),
      this.diskSaveTimerInSeconds * 1000
    );
  }

  register(draft: ConversationCachedMessage): void {
    if (!this.useCache) return;

    const k = Cache.nameKey(draft.channel);

    this.cache[k] = new ConversationDraftRecord(draft.channel, draft.message);
  }

  deregister(channel: string): void {
    if (!this.useCache) return;

    const k = Cache.nameKey(channel);

    delete this.cache[k];
    this.saveCacheToDisk();
  }

  private saveCacheToDisk(): void {
    if (!this.useCache) return;

    // Buffer close writes. Missing an occasional save isn't the end of the world.
    const now = Date.now();
    if (now - this.lastCacheSave < 5000) return;

    this.lastCacheSave = now;
    saveDrafts(this.cache);
  }
}
