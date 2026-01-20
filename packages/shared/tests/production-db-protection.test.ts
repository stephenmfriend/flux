import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync, writeFileSync, statSync, mkdirSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

/**
 * Integration test to verify that the test suite NEVER touches production database files.
 *
 * This test:
 * 1. Creates a fake .flux/data.json file in project root
 * 2. Records its modification time and content hash
 * 3. Runs the full test suite
 * 4. Verifies the file is unchanged
 *
 * If this test fails, it means tests are writing to production database - CRITICAL BUG!
 */
describe('Production database protection (integration test)', () => {
  const projectRoot = join(__dirname, '../../..');
  const fluxDir = join(projectRoot, '.flux');
  const dataFile = join(fluxDir, 'data.json');

  let originalContent: string | null = null;
  let originalMtime: Date | null = null;
  let originalHash: string | null = null;
  let hadFluxDir = false;
  let hadDataFile = false;

  beforeAll(() => {
    // Check if .flux directory already exists
    hadFluxDir = existsSync(fluxDir);
    hadDataFile = existsSync(dataFile);

    // If .flux/data.json exists, back up its state
    if (hadDataFile) {
      originalContent = readFileSync(dataFile, 'utf-8');
      originalMtime = statSync(dataFile).mtime;
      originalHash = createHash('sha256').update(originalContent).digest('hex');
    } else {
      // Create test production database
      if (!hadFluxDir) {
        mkdirSync(fluxDir, { recursive: true });
      }

      const testData = JSON.stringify({
        projects: [
          {
            id: 'prod-project',
            name: 'Production Project',
            description: 'This should NEVER be touched by tests'
          }
        ],
        epics: [],
        tasks: []
      }, null, 2);

      writeFileSync(dataFile, testData, 'utf-8');

      // Wait a moment to ensure mtime is stable
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Busy wait to ensure filesystem mtime has settled
      }

      originalContent = testData;
      originalMtime = statSync(dataFile).mtime;
      originalHash = createHash('sha256').update(testData).digest('hex');
    }
  });

  afterAll(() => {
    // Clean up: remove test .flux directory if we created it
    if (!hadFluxDir && existsSync(fluxDir)) {
      try {
        if (existsSync(dataFile)) {
          unlinkSync(dataFile);
        }
        rmdirSync(fluxDir);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  });

  it('production database file is never modified by test suite', () => {
    // Verify file exists before test
    expect(existsSync(dataFile)).toBe(true);
    expect(originalContent).toBeTruthy();
    expect(originalMtime).toBeInstanceOf(Date);
    expect(originalHash).toBeTruthy();

    // Run test suite (excluding this file to avoid recursion)
    // We only run store and API tests which are most likely to touch the DB
    try {
      execSync('bun test packages/shared/tests/store.test.ts packages/server/tests/api-priority.test.ts', {
        cwd: projectRoot,
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });
    } catch (err) {
      // Even if tests fail, we still want to check if database was touched
      console.warn('Some tests failed, but continuing to check database integrity');
    }

    // Verify file still exists
    expect(existsSync(dataFile)).toBe(true);

    // Verify content is unchanged
    const currentContent = readFileSync(dataFile, 'utf-8');
    const currentHash = createHash('sha256').update(currentContent).digest('hex');

    expect(currentHash).toBe(originalHash);
    expect(currentContent).toBe(originalContent);

    // Verify modification time is unchanged
    const currentMtime = statSync(dataFile).mtime;
    expect(currentMtime.getTime()).toBe(originalMtime!.getTime());
  }, 60000); // 60 second timeout for running full test suite
});
