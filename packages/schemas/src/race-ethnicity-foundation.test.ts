import { describe, expect, it } from 'vitest';

import raceEthnicityJson from '../../../content/catalogs/demographics/race-ethnicity.json';
import {
  RaceEthnicityCatalogSchema,
  ResolvedPatientDemographicsSchema,
  ResolvedPatientDemographicsV3Schema,
  ResolvedPatientRaceEthnicitySchema,
} from './index';

describe('race/ethnicity authoring foundation', () => {
  it('parses the exact source-linked multiselect category catalog', () => {
    const catalog = RaceEthnicityCatalogSchema.parse(raceEthnicityJson);

    expect(catalog.standard).toMatchObject({
      collectionFormat: 'combined_race_ethnicity',
      responseMode: 'select_all_that_apply',
      classificationBasis: 'self_identified_sociopolitical',
      granularity: 'minimum_categories_only',
      evidenceSourceId: 'evidence.omb.spd15.2024',
    });
    expect(catalog.categories).toHaveLength(7);
  });

  it('preserves multiple self-identified categories in a versioned demographics record', () => {
    const demographics = ResolvedPatientDemographicsV3Schema.parse({
      recordVersion: 3,
      ageYears: 42,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
      raceEthnicity: {
        recordVersion: 1,
        standardId: 'race-ethnicity-standard.omb-spd15-2024',
        standardContentVersion: '1.0.0',
        collectionStatus: 'provided',
        identificationBasis: 'self_identified',
        categoryIds: [
          'race-ethnicity.black-or-african-american',
          'race-ethnicity.hispanic-or-latino',
        ],
      },
    });

    expect(demographics.raceEthnicity.categoryIds).toEqual([
      'race-ethnicity.black-or-african-american',
      'race-ethnicity.hispanic-or-latino',
    ]);
  });

  it('keeps not-recorded and declined states distinct from a negative category response', () => {
    expect(
      ResolvedPatientRaceEthnicitySchema.parse({
        recordVersion: 1,
        standardId: 'race-ethnicity-standard.omb-spd15-2024',
        standardContentVersion: '1.0.0',
        collectionStatus: 'not_recorded',
        identificationBasis: null,
        categoryIds: [],
      }).collectionStatus,
    ).toBe('not_recorded');
    expect(
      ResolvedPatientRaceEthnicitySchema.parse({
        recordVersion: 1,
        standardId: 'race-ethnicity-standard.omb-spd15-2024',
        standardContentVersion: '1.0.0',
        collectionStatus: 'declined_to_answer',
        identificationBasis: null,
        categoryIds: [],
      }).collectionStatus,
    ).toBe('declined_to_answer');
  });

  it('rejects empty or duplicate provided identities and categories on missing states', () => {
    const base = {
      recordVersion: 1,
      standardId: 'race-ethnicity-standard.omb-spd15-2024',
      standardContentVersion: '1.0.0',
    } as const;

    expect(
      ResolvedPatientRaceEthnicitySchema.safeParse({
        ...base,
        collectionStatus: 'provided',
        identificationBasis: 'self_identified',
        categoryIds: [],
      }).success,
    ).toBe(false);
    expect(
      ResolvedPatientRaceEthnicitySchema.safeParse({
        ...base,
        collectionStatus: 'provided',
        identificationBasis: 'self_identified',
        categoryIds: ['race-ethnicity.asian', 'race-ethnicity.asian'],
      }).success,
    ).toBe(false);
    expect(
      ResolvedPatientRaceEthnicitySchema.safeParse({
        ...base,
        collectionStatus: 'not_recorded',
        identificationBasis: null,
        categoryIds: ['race-ethnicity.asian'],
      }).success,
    ).toBe(false);
  });

  it('keeps historical v2 demographic snapshots valid without inventing an identity', () => {
    expect(
      ResolvedPatientDemographicsSchema.parse({
        recordVersion: 2,
        ageYears: 42,
        reviewedAgeBandId: 'age-band.middle-adult',
        sexForReference: 'female',
      }),
    ).toEqual({
      recordVersion: 2,
      ageYears: 42,
      reviewedAgeBandId: 'age-band.middle-adult',
      sexForReference: 'female',
    });
  });

  it('rejects clinical weights or name-based inference fields from the identity catalog', () => {
    expect(
      RaceEthnicityCatalogSchema.safeParse({
        ...raceEthnicityJson,
        diagnosisWeights: { 'diagnosis.major-depressive-disorder': 1.2 },
      }).success,
    ).toBe(false);
    expect(
      RaceEthnicityCatalogSchema.safeParse({
        ...raceEthnicityJson,
        inferFromNamePoolId: 'variant-pool.fictional-last-names.general-adult',
      }).success,
    ).toBe(false);
  });
});
