/**
 * Import/Export module
 *
 * This module provides functionality for:
 * - Startup auto-import (Rising/Slimcat)
 * - Vanilla (Rising/3.0/Frolic) importer operations
 * - ZIP backup export
 * - ZIP backup import/restore
 * - Legacy Slimcat import
 */

// Startup import
export * from './importer/startup-import';

// Vanilla import core (formerly "Rising" - supports Rising/3.0/Frolic)
export * as VanillaImporter from './importer/vanilla-importer';

// Vanilla import UI helpers
export * from './importer/vanilla-import-ui';

// Backup export
export * from './exporter/backup-export';

// Backup import
export * from './importer/backup-import';

// Legacy importers
export * as SlimcatImporter from './importer/importer';

// Re-export commonly used types
export type {
  VanillaContext,
  ImportType,
  CharacterImportOptions,
  ImportSummary
} from './importer/vanilla-importer';
