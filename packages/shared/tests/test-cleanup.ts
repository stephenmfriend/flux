import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Clean up temporary SQLite database files created during tests.
 * These files are created when using ':memory:' with older SQLite adapter code.
 */
export function cleanupTempDatabases(): void {
  const projectRoot = join(__dirname, '../../..');

  try {
    const files = readdirSync(projectRoot);
    const tempDbFiles = files.filter(f => f.startsWith('file::memory:'));

    for (const file of tempDbFiles) {
      try {
        unlinkSync(join(projectRoot, file));
      } catch (err) {
        // Ignore errors - file may already be deleted
      }
    }
  } catch (err) {
    // Ignore if directory doesn't exist or can't be read
  }
}
