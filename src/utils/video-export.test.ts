import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPORT_RESOLUTION_SPECS,
  buildExportFilename,
  formatBytes,
  getExportPixelDimensions,
  normalizeExportResolution,
} from './video-export';

test('normalizeExportResolution resolves 1080p, 2K, and 4K presets', () => {
  assert.equal(normalizeExportResolution(undefined), '1080p');
  assert.equal(normalizeExportResolution('2k'), '2K');
  assert.equal(normalizeExportResolution('1440p'), '2K');
  assert.equal(normalizeExportResolution('4k'), '4K');
  assert.equal(normalizeExportResolution('2160P'), '4K');
  assert.equal(normalizeExportResolution('uhd'), '4K');
});

test('getExportPixelDimensions returns exact even pixel dimensions across 1080p, 2K, 4K', () => {
  assert.deepEqual(getExportPixelDimensions('9:16', '1080p'), { width: 1080, height: 1920 });
  assert.deepEqual(getExportPixelDimensions('9:16', '2K'), { width: 1440, height: 2560 });
  assert.deepEqual(getExportPixelDimensions('9:16', '4K'), { width: 2160, height: 3840 });

  assert.deepEqual(getExportPixelDimensions('16:9', '1080p'), { width: 1920, height: 1080 });
  assert.deepEqual(getExportPixelDimensions('16:9', '2K'), { width: 2560, height: 1440 });
  assert.deepEqual(getExportPixelDimensions('16:9', '4K'), { width: 3840, height: 2160 });

  assert.deepEqual(getExportPixelDimensions('1:1', '4K'), { width: 2160, height: 2160 });
  assert.deepEqual(getExportPixelDimensions('3:4', '2K'), { width: 1440, height: 1920 });

  for (const ar of ['9:16', '16:9', '1:1', '3:4', '4:5']) {
    for (const res of ['1080p', '2K', '4K'] as const) {
      const dims = getExportPixelDimensions(ar, res);
      assert.equal(dims.width % 2, 0);
      assert.equal(dims.height % 2, 0);
      assert.ok(EXPORT_RESOLUTION_SPECS[res].videoBitsPerSecond > 0);
    }
  }
});

test('buildExportFilename creates clean .mp4 filename with resolution suffix', () => {
  assert.equal(
    buildExportFilename('Kenapa Pagi Terasa Berat?', '4K', 'mp4'),
    'kenapa-pagi-terasa-berat-4k.mp4'
  );
  assert.equal(buildExportFilename('', '2K', 'mp4'), 'satset-motion-2k.mp4');
  assert.equal(formatBytes(2_500_000), '2.4 MB');
});
