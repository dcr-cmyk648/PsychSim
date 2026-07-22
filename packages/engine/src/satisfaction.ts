import {
  SatisfactionStateSchema,
  type SatisfactionConfiguration,
  type SatisfactionState,
} from '@psychsim/schemas';

const roundMultiplier = (value: number): number => Math.round(value * 1_000) / 1_000;

/**
 * Converts additive decor points into a capped multiplier. The rational curve is
 * deterministic, transparent, and has diminishing returns without changing care points.
 */
export const calculateSatisfactionState = (
  rawPoints: number,
  configuration: SatisfactionConfiguration,
): SatisfactionState => {
  const safeRawPoints = Math.max(0, rawPoints);
  const diminishingReturnValue =
    safeRawPoints === 0 ? 0 : safeRawPoints / (safeRawPoints + configuration.halfSaturationPoints);
  const multiplier = Math.min(
    configuration.multiplierCap,
    1 + (configuration.multiplierCap - 1) * diminishingReturnValue,
  );
  return SatisfactionStateSchema.parse({
    schemaVersion: 1,
    rawPoints: safeRawPoints,
    diminishingReturnValue,
    multiplier: roundMultiplier(multiplier),
    configuredCap: configuration.multiplierCap,
  });
};
