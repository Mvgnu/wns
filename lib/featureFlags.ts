// meta: module=featureFlags purpose="Centralized runtime feature toggle evaluation"
import { cache } from 'react';

type FeatureFlagName =
  | 'eventLifecycle'
  | 'personalizedHome'
  | 'organizerConsole'
  | 'groupChat'
  | 'geoDiscovery'
  | 'growthOnboarding'
  | 'analyticsDashboards'
  | 'resilienceCircuitBreakers'
  | 'smokeTests';

type FeatureFlagDefinition = {
  readonly description: string;
  readonly defaultEnabled: boolean;
};

type FeatureFlagConfig = Record<FeatureFlagName, FeatureFlagDefinition>;

type FlagOverrides = Map<FeatureFlagName, boolean>;

const FLAG_PREFIX = 'FEATURE_';

const flagDefinitions: FeatureFlagConfig = {
  eventLifecycle: {
    description: 'Controls RSVP lifecycle features (waitlists, feedback, organizer tooling).',
    defaultEnabled: true
  },
  personalizedHome: {
    description: 'Gates personalized recommendations on the homepage.',
    defaultEnabled: true
  },
  organizerConsole: {
    description: 'Enables organizer management console, monetization, and sponsorship tooling.',
    defaultEnabled: true
  },
  groupChat: {
    description: 'Turns on real-time chat and threaded discussions inside groups.',
    defaultEnabled: true
  },
  geoDiscovery: {
    description: 'Exposes hotspot APIs and map overlays for location intelligence.',
    defaultEnabled: true
  },
  growthOnboarding: {
    description: 'Activates onboarding wizard, referral tracking, and achievements.',
    defaultEnabled: true
  },
  analyticsDashboards: {
    description: 'Allows privacy-preserving analytics aggregation and dashboards.',
    defaultEnabled: true
  },
  resilienceCircuitBreakers: {
    description: 'Wraps critical services with circuit breakers and graceful degradation.',
    defaultEnabled: true
  },
  smokeTests: {
    description: 'Runs Playwright smoke suites during CI or local verification.',
    defaultEnabled: true
  }
};

const runtimeOverrides: FlagOverrides = new Map();

function toEnvKey(flag: FeatureFlagName) {
  return `${FLAG_PREFIX}${flag.toUpperCase()}`;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === '1' || value?.toLowerCase() === 'true' || value?.toLowerCase() === 'on') return true;
  if (value === '0' || value?.toLowerCase() === 'false' || value?.toLowerCase() === 'off') return false;
  return undefined;
}

const readEnvFlags = cache((): Partial<Record<FeatureFlagName, boolean>> => {
  const resolved: Partial<Record<FeatureFlagName, boolean>> = {};
  (Object.keys(flagDefinitions) as FeatureFlagName[]).forEach((flag) => {
    const envValue = parseBoolean(process.env[toEnvKey(flag)]);
    if (envValue !== undefined) {
      resolved[flag] = envValue;
    }
  });
  return resolved;
});

export function getFeatureFlags(): Array<{ name: FeatureFlagName; enabled: boolean; description: string }> {
  const envFlags = readEnvFlags();
  return (Object.keys(flagDefinitions) as FeatureFlagName[]).map((flag) => ({
    name: flag,
    description: flagDefinitions[flag].description,
    enabled: resolveFlag(flag, envFlags)
  }));
}

function resolveFlag(flag: FeatureFlagName, envFlags?: Partial<Record<FeatureFlagName, boolean>>) {
  if (runtimeOverrides.has(flag)) {
    return runtimeOverrides.get(flag)!;
  }
  const envOverrides = envFlags ?? readEnvFlags();
  if (envOverrides[flag] !== undefined) {
    return envOverrides[flag] as boolean;
  }
  return flagDefinitions[flag].defaultEnabled;
}

export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return resolveFlag(flag);
}

export function setFeatureOverride(flag: FeatureFlagName, enabled: boolean) {
  runtimeOverrides.set(flag, enabled);
}

export function clearFeatureOverrides() {
  runtimeOverrides.clear();
}

