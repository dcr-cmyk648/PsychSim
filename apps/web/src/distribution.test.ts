// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import {
  buildDistributionReloadUrl,
  compareDistribution,
  createVersionManifestUrl,
  fetchDistributionManifest,
  isAppleMobileDevice,
  parseDistributionManifest,
  type DistributionManifest,
} from './distribution';

const current: DistributionManifest = {
  schemaVersion: 1,
  distributionId: '1111111111111111111111111111111111111111',
  buildKind: 'portable_reviewer',
  channel: 'main',
};

describe('distribution updates', () => {
  it('strictly parses a main release and rejects malformed or short main IDs', () => {
    expect(parseDistributionManifest(current)).toEqual(current);
    expect(parseDistributionManifest({ ...current, distributionId: '111111111111' })).toBeNull();
    expect(parseDistributionManifest({ ...current, unexpected: true })).toBeNull();
    expect(parseDistributionManifest({ ...current, buildKind: 'developer' })).toBeNull();
  });

  it('uses a base-aware uncached version URL', () => {
    expect(createVersionManifestUrl('https://example.test/PsychSim/', 123).toString()).toBe(
      'https://example.test/PsychSim/version.json?check=123',
    );
  });

  it('detects only a newer release for the same channel and build kind', () => {
    expect(
      compareDistribution(current, {
        ...current,
        distributionId: '2222222222222222222222222222222222222222',
      }).updateAvailable,
    ).toBe(true);
    expect(
      compareDistribution(current, {
        ...current,
        distributionId: '2222222222222222222222222222222222222222',
        buildKind: 'player',
      }).updateAvailable,
    ).toBe(false);
    expect(compareDistribution(current, null).updateAvailable).toBe(false);
  });

  it('fetches without credentials or cache and rejects invalid release data', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(current), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await expect(
      fetchDistributionManifest('https://example.test/PsychSim/', 456, fetcher),
    ).resolves.toEqual(current);
    expect(fetcher).toHaveBeenCalledWith(
      new URL('https://example.test/PsychSim/version.json?check=456'),
      {
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      },
    );
  });

  it('creates a reload URL without dropping the existing path or query', () => {
    expect(
      buildDistributionReloadUrl(
        'https://example.test/PsychSim/?mode=review#patient',
        '2222222222222222222222222222222222222222',
      ),
    ).toBe(
      'https://example.test/PsychSim/?mode=review&release=2222222222222222222222222222222222222222#patient',
    );
  });

  it('recognizes modern iPhone and iPad user agents', () => {
    expect(
      isAppleMobileDevice({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      } as Navigator),
    ).toBe(true);
    expect(
      isAppleMobileDevice({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      } as Navigator),
    ).toBe(true);
  });
});
