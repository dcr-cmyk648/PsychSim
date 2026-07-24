export interface DistributionManifest {
  schemaVersion: 1;
  distributionId: string;
  buildKind: 'player' | 'portable_reviewer';
  channel: string;
}

export interface DistributionCheckResult {
  current: DistributionManifest;
  remote: DistributionManifest | null;
  updateAvailable: boolean;
}

const LOCAL_DISTRIBUTION_ID = /^(?:development|[0-9a-f]{7,64})$/;
const DISTRIBUTION_CHANNEL = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export const CURRENT_DISTRIBUTION: DistributionManifest =
  typeof __PSYCHSIM_DISTRIBUTION__ === 'undefined'
    ? {
        schemaVersion: 1,
        distributionId: 'development',
        buildKind: 'player',
        channel: 'local',
      }
    : __PSYCHSIM_DISTRIBUTION__;

export const parseDistributionManifest = (value: unknown): DistributionManifest | null => {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  if (
    keys.join(',') !== 'buildKind,channel,distributionId,schemaVersion' ||
    candidate.schemaVersion !== 1 ||
    typeof candidate.distributionId !== 'string' ||
    !LOCAL_DISTRIBUTION_ID.test(candidate.distributionId) ||
    (candidate.buildKind !== 'player' && candidate.buildKind !== 'portable_reviewer') ||
    typeof candidate.channel !== 'string' ||
    !DISTRIBUTION_CHANNEL.test(candidate.channel)
  ) {
    return null;
  }
  if (candidate.channel === 'main' && !/^[0-9a-f]{40}$/.test(candidate.distributionId)) {
    return null;
  }
  return {
    schemaVersion: 1,
    distributionId: candidate.distributionId,
    buildKind: candidate.buildKind,
    channel: candidate.channel,
  };
};

export const createVersionManifestUrl = (baseUri: string, cacheBuster: number): URL => {
  const url = new URL('version.json', baseUri);
  url.searchParams.set('check', String(cacheBuster));
  return url;
};

export const fetchDistributionManifest = async (
  baseUri: string,
  cacheBuster: number,
  fetcher: typeof fetch = fetch,
): Promise<DistributionManifest | null> => {
  const response = await fetcher(createVersionManifestUrl(baseUri, cacheBuster), {
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) return null;
  return parseDistributionManifest(await response.json());
};

export const compareDistribution = (
  current: DistributionManifest,
  remote: DistributionManifest | null,
): DistributionCheckResult => ({
  current,
  remote,
  updateAvailable:
    remote !== null &&
    remote.buildKind === current.buildKind &&
    remote.channel === current.channel &&
    remote.distributionId !== current.distributionId,
});

export const buildDistributionReloadUrl = (currentUrl: string, distributionId: string): string => {
  const destination = new URL(currentUrl);
  destination.searchParams.set('release', distributionId);
  return destination.toString();
};

export const isStandaloneWebApp = (
  navigatorValue: Navigator = navigator,
  matcher: { matchMedia?: Window['matchMedia'] } = window,
): boolean =>
  Boolean(matcher.matchMedia?.('(display-mode: standalone)').matches) ||
  Boolean((navigatorValue as Navigator & { standalone?: boolean }).standalone);

export const isAppleMobileDevice = (navigatorValue: Navigator = navigator): boolean =>
  /iphone|ipad|ipod/i.test(navigatorValue.userAgent) ||
  (navigatorValue.platform === 'MacIntel' && navigatorValue.maxTouchPoints > 1);
