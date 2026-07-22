import {
  CaseBlueprintSchema,
  CatalogBundleSchema,
  ClinicStateSchema,
  PlayerProfileSchema,
} from '@psychsim/schemas';

import servicesJson from '../../../content/catalogs/services/services.json';
import fluoxetineJson from '../../../content/catalogs/medications/definitions/fluoxetine.medication.json';
import aripiprazoleJson from '../../../content/catalogs/medications/definitions/aripiprazole.medication.json';
import propranololJson from '../../../content/catalogs/medications/definitions/propranolol.medication.json';
import buspironeJson from '../../../content/catalogs/medications/definitions/buspirone.medication.json';
import haloperidolJson from '../../../content/catalogs/medications/definitions/haloperidol.medication.json';
import sertralineJson from '../../../content/catalogs/medications/definitions/sertraline.medication.json';
import escitalopramJson from '../../../content/catalogs/medications/definitions/escitalopram.medication.json';
import bupropionJson from '../../../content/catalogs/medications/definitions/bupropion.medication.json';
import mirtazapineJson from '../../../content/catalogs/medications/definitions/mirtazapine.medication.json';
import citalopramJson from '../../../content/catalogs/medications/definitions/citalopram.medication.json';
import formulariesJson from '../../../content/catalogs/medications/formularies.json';
import treatmentsJson from '../../../content/catalogs/treatments/treatments.json';
import locationsJson from '../../../content/catalogs/locations/locations.json';
import facilitiesJson from '../../../content/catalogs/locations/facilities.json';
import informationActionsJson from '../../../content/catalogs/actions/actions.json';
import variantPoolsJson from '../../../content/catalogs/demographics/variant-pools.json';
import a1cTestJson from '../../../content/catalogs/tests/definitions/a1c.test.json';
import b12FolateTestJson from '../../../content/catalogs/tests/definitions/b12-folate.test.json';
import brainMriTestJson from '../../../content/catalogs/tests/definitions/brain-mri.test.json';
import cbcTestJson from '../../../content/catalogs/tests/definitions/cbc.test.json';
import cmpTestJson from '../../../content/catalogs/tests/definitions/cmp.test.json';
import ecgTestJson from '../../../content/catalogs/tests/definitions/ecg.test.json';
import eegTestJson from '../../../content/catalogs/tests/definitions/eeg.test.json';
import headCtTestJson from '../../../content/catalogs/tests/definitions/head-ct.test.json';
import lipidsTestJson from '../../../content/catalogs/tests/definitions/lipids.test.json';
import medicationLevelTestJson from '../../../content/catalogs/tests/definitions/medication-level.test.json';
import pharmacogenomicsTestJson from '../../../content/catalogs/tests/definitions/pharmacogenomics.test.json';
import pregnancyTestJson from '../../../content/catalogs/tests/definitions/pregnancy.test.json';
import tshTestJson from '../../../content/catalogs/tests/definitions/tsh.test.json';
import urineToxicologyTestJson from '../../../content/catalogs/tests/definitions/urine-toxicology.test.json';
import referenceIntervalSetsJson from '../../../content/catalogs/tests/reference-interval-sets.json';
import upgradesJson from '../../../content/catalogs/upgrades/upgrades.json';
import prototypeCaseJson from '../../../content/cases/approved/first-visit-depression.case.json';
import medicationCheckPalpitationsJson from '../../../content/cases/approved/medication-check-palpitations.case.json';

export const catalogs = CatalogBundleSchema.parse({
  schemaVersion: 1,
  contentVersion: '2.0.0',
  services: servicesJson,
  medications: [
    fluoxetineJson,
    aripiprazoleJson,
    propranololJson,
    buspironeJson,
    haloperidolJson,
    sertralineJson,
    escitalopramJson,
    bupropionJson,
    mirtazapineJson,
    citalopramJson,
  ],
  formularies: formulariesJson,
  treatments: treatmentsJson,
  locations: locationsJson,
  facilities: facilitiesJson,
  informationActions: informationActionsJson,
  variantPools: variantPoolsJson,
  tests: [
    a1cTestJson,
    b12FolateTestJson,
    brainMriTestJson,
    cbcTestJson,
    cmpTestJson,
    ecgTestJson,
    eegTestJson,
    headCtTestJson,
    lipidsTestJson,
    medicationLevelTestJson,
    pharmacogenomicsTestJson,
    pregnancyTestJson,
    tshTestJson,
    urineToxicologyTestJson,
  ],
  referenceIntervalSets: referenceIntervalSetsJson,
  upgrades: upgradesJson,
});

export const prototypeCaseBlueprint = CaseBlueprintSchema.parse(prototypeCaseJson);
export const medicationCheckPalpitationsBlueprint = CaseBlueprintSchema.parse(
  medicationCheckPalpitationsJson,
);
export const approvedCaseBlueprints = [
  prototypeCaseBlueprint,
  medicationCheckPalpitationsBlueprint,
] as const;

export const startingClinic = ClinicStateSchema.parse({
  schemaVersion: 1,
  id: 'clinic.player-solo-office',
  label: 'Lakeshore Psychiatric Office',
  facilityId: 'facility.solo-office',
  facilityTier: 'solo_office',
  locationIds: ['location.solo-office.outpatient'],
  activeLocationId: 'location.solo-office.outpatient',
  departmentIds: [],
  capabilities: [
    'history.basic',
    'medication-review.basic',
    'mental-status.basic',
    'vitals.basic',
    'exam.medical',
    'counseling.basic',
    'disposition.outpatient',
    'disposition.external-referral',
    'disposition.emergency-transfer',
  ],
  ownedUpgradeIds: [],
  ownedEquipmentIds: [],
  formularyIds: ['formulary.starter'],
  clinicPoints: 250,
  lifetimePointsEarned: 0,
  satisfaction: 0,
  satisfactionMultiplier: 1,
});

export const startingProfile = PlayerProfileSchema.parse({
  schemaVersion: 1,
  id: 'player.local-profile',
  clinic: startingClinic,
  progressionMode: 'standard',
  completedAttemptIds: [],
});
