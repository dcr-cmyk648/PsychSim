import type { VariantGenerator, VariantPoolDefinition } from '@psychsim/schemas';

export const hashSeed = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
};

export const hashToHex = (value: string): string => hashSeed(value).toString(16).padStart(8, '0');

export const seededUnit = (seed: string, key: string): number =>
  hashSeed(`${seed}:${key}`) / 0x1_0000_0000;

export const resolveVariant = (
  generator: VariantGenerator,
  seed: string,
  key: string,
  pools: readonly VariantPoolDefinition[],
): string | number => {
  const unit = seededUnit(seed, key);
  switch (generator.type) {
    case 'choice': {
      const index = Math.min(
        generator.values.length - 1,
        Math.floor(unit * generator.values.length),
      );
      return generator.values[index] ?? generator.values[0] ?? '';
    }
    case 'catalogChoice': {
      const values = pools.find((pool) => pool.id === generator.poolId)?.values;
      if (!values?.length) throw new Error(`Unknown or empty variant pool: ${generator.poolId}`);
      const index = Math.min(values.length - 1, Math.floor(unit * values.length));
      return values[index] ?? values[0] ?? '';
    }
    case 'fictionalName': {
      const firstNames = pools.find((pool) => pool.id === generator.firstNamePoolId)?.values;
      const lastNames = pools.find((pool) => pool.id === generator.lastNamePoolId)?.values;
      if (!firstNames?.length) {
        throw new Error(`Unknown or empty first-name pool: ${generator.firstNamePoolId}`);
      }
      if (!lastNames?.length) {
        throw new Error(`Unknown or empty last-name pool: ${generator.lastNamePoolId}`);
      }
      const firstName =
        firstNames[
          Math.min(
            firstNames.length - 1,
            Math.floor(seededUnit(seed, `${key}:first`) * firstNames.length),
          )
        ] ?? firstNames[0]!;
      const lastName =
        lastNames[
          Math.min(
            lastNames.length - 1,
            Math.floor(seededUnit(seed, `${key}:last`) * lastNames.length),
          )
        ] ?? lastNames[0]!;
      const includesMiddleInitial =
        seededUnit(seed, `${key}:middle-present`) < generator.middleInitialProbability;
      const middleInitial = String.fromCharCode(
        65 + Math.min(25, Math.floor(seededUnit(seed, `${key}:middle-letter`) * 26)),
      );
      return `${firstName}${includesMiddleInitial ? ` ${middleInitial}.` : ''} ${lastName}`;
    }
    case 'weightedChoice': {
      const totalWeight = generator.options.reduce((sum, option) => sum + option.weight, 0);
      let cursor = unit * totalWeight;
      for (const option of generator.options) {
        cursor -= option.weight;
        if (cursor < 0) return option.value;
      }
      return generator.options.at(-1)?.value ?? '';
    }
    case 'integerRange': {
      const span = generator.max - generator.min + 1;
      return generator.min + Math.min(span - 1, Math.floor(unit * span));
    }
    case 'decimalRange': {
      const raw = generator.min + unit * (generator.max - generator.min);
      const scale = 10 ** generator.decimals;
      return Math.round(raw * scale) / scale;
    }
    case 'textTemplate': {
      return generator.template.replace(
        /\{\{([a-zA-Z0-9_.-]+)\}\}/g,
        (_match, variable: string) => {
          const values = generator.variables[variable];
          if (!values?.length) return '';
          const index = Math.min(
            values.length - 1,
            Math.floor(seededUnit(seed, `${key}:${variable}`) * values.length),
          );
          return values[index] ?? '';
        },
      );
    }
  }
};
