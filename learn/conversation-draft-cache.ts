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

  loadCache(): void {
    if (!core.connection.character || this.cacheAlreadyLoaded) return;

    const drafts = getDrafts();
    this.cache = drafts || {};
    log.info('Drafts loaded, if any');

    // Save cache to disk every minute.
    // TODO: Make this configurable.
    this.cacheAlreadyLoaded = true;
    setInterval(() => this.saveCacheToDisk(), 60000);
  }

  register(draft: ConversationCachedMessage): void {
    const k = Cache.nameKey(draft.channel);

    this.cache[k] = new ConversationDraftRecord(draft.channel, draft.message);

    log.info(`Saved draft for ${draft.channel}: ${draft.message}`);
  }

  deregister(channel: string): void {
    const k = Cache.nameKey(channel);

    delete this.cache[k];
    this.saveCacheToDisk();
  }

  private saveCacheToDisk(): void {
    // Buffer close writes. Missing an occasional save isn't the end of the world.
    const now = Date.now();
    if (now - this.lastCacheSave < 5000) return;

    this.lastCacheSave = now;
    saveDrafts(this.cache);
  }
}
