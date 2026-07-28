import {
  CaseBlueprintSchema,
  CatalogBundleSchema,
  ClinicStateSchema,
  PlayerProfileSchema,
} from '@psychsim/schemas';

import aceGadGuidelineJson from '../../../content/catalogs/evidence/formal/ace-gad-2025-guideline.evidence.json';
import apaBpdGuidelineJson from '../../../content/catalogs/evidence/formal/apa-bpd-second-edition-2024-guideline.evidence.json';
import apaDeliriumGuidelineJson from '../../../content/catalogs/evidence/formal/apa-delirium-2025-guideline.evidence.json';
import asamBenzodiazepineTaperingGuidelineJson from '../../../content/catalogs/evidence/formal/asam-benzodiazepine-tapering-2025-guideline.evidence.json';
import bapCatatoniaGuidelineJson from '../../../content/catalogs/evidence/formal/bap-catatonia-2023-guideline.evidence.json';
import bostwickAntidepressantFitReviewJson from '../../../content/catalogs/evidence/formal/bostwick-2010-antidepressant-fit-review.evidence.json';
import canmatMddCorrigendumJson from '../../../content/catalogs/evidence/formal/canmat-2023-mdd-corrigendum-2025.evidence.json';
import canmatMddGuidelineJson from '../../../content/catalogs/evidence/formal/canmat-2023-mdd-guideline.evidence.json';
import fdaCitalopramLabelJson from '../../../content/catalogs/evidence/formal/fda-citalopram-capsules-2023-label.evidence.json';
import fdaAbilifyMaintenaLabelJson from '../../../content/catalogs/evidence/formal/fda-abilify-maintena-2025-label.evidence.json';
import fdaAbilifyOralLabelJson from '../../../content/catalogs/evidence/formal/fda-abilify-oral-2025-label.evidence.json';
import fdaClozarilLabelJson from '../../../content/catalogs/evidence/formal/fda-clozaril-2025-label.evidence.json';
import mishraClozapineAugmentationJson from '../../../content/catalogs/evidence/formal/mishra-2024-clozapine-augmentation-network-meta-analysis.evidence.json';
import mhraCitalopramQtJson from '../../../content/catalogs/evidence/formal/mhra-citalopram-escitalopram-qt-2014.evidence.json';
import nhsCyclothymiaJson from '../../../content/catalogs/evidence/formal/nhs-cyclothymia-2023.evidence.json';
import nhsHeartPalpitationsJson from '../../../content/catalogs/evidence/formal/nhs-heart-palpitations-2026.evidence.json';
import niceSelfHarmGuidelineJson from '../../../content/catalogs/evidence/formal/nice-self-harm-ng225-2022-guideline.evidence.json';
import nlmRxNormCpcJson from '../../../content/catalogs/evidence/formal/nlm-rxnorm-cpc-2026-07-06.evidence.json';
import roerigClozapineAugmentationJson from '../../../content/catalogs/evidence/formal/roerig-2019-clozapine-augmentation-strategies.evidence.json';
import tiihonenClozapineAugmentationDoseJson from '../../../content/catalogs/evidence/formal/tiihonen-2025-clozapine-augmentation-dose-cohorts.evidence.json';
import tiihonenClozapineAripiprazoleJson from '../../../content/catalogs/evidence/formal/tiihonen-2019-clozapine-aripiprazole-rehospitalization.evidence.json';
import vaDodBipolarGuidelineJson from '../../../content/catalogs/evidence/formal/va-dod-bipolar-2023-guideline.evidence.json';
import vaDodSchizophreniaGuidelineJson from '../../../content/catalogs/evidence/formal/va-dod-schizophrenia-2023-guideline.evidence.json';
import vaDodSuicideRiskGuidelineJson from '../../../content/catalogs/evidence/formal/va-dod-suicide-risk-2024-guideline.evidence.json';
import villanuevaEpilepsyDepressionConsensusJson from '../../../content/catalogs/evidence/formal/villanueva-epilepsy-depression-consensus-2023.evidence.json';
import whoMhgapGuidelineJson from '../../../content/catalogs/evidence/formal/who-mhgap-2023-guideline.evidence.json';
import bipolarSpectrumDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/bipolar-spectrum-disorder.diagnosis.json';
import borderlinePersonalityDisorderDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/borderline-personality-disorder.diagnosis.json';
import majorDepressiveDisorderDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/major-depressive-disorder.diagnosis.json';
import medicationInducedAkathisiaDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/medication-induced-akathisia.diagnosis.json';
import persistentDepressiveDisorderDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/persistent-depressive-disorder.diagnosis.json';
import substanceInducedMoodDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/substance-induced-mood-disorder.diagnosis.json';
import generalizedAnxietyDisorderDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/generalized-anxiety-disorder.diagnosis.json';
import posttraumaticStressDisorderDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/posttraumatic-stress-disorder.diagnosis.json';
import schizophreniaSpectrumDisorderDiagnosisJson from '../../../content/catalogs/diagnoses/definitions/schizophrenia-spectrum-disorder.diagnosis.json';
import depressedMoodFindingJson from '../../../content/catalogs/findings/definitions/depressed-mood.finding.json';
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
import lithiumJson from '../../../content/catalogs/medications/definitions/lithium.medication.json';
import olanzapineJson from '../../../content/catalogs/medications/definitions/olanzapine.medication.json';
import quetiapineJson from '../../../content/catalogs/medications/definitions/quetiapine.medication.json';
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
import reactionConceptsJson from '../../../content/catalogs/reactions/reaction-concepts.json';
import upgradesJson from '../../../content/catalogs/upgrades/upgrades.json';
import decorJson from '../../../content/catalogs/decor/decor.json';
import prototypeCaseJson from '../../../content/cases/approved/first-visit-depression.case.json';
import medicationCheckPalpitationsJson from '../../../content/cases/approved/medication-check-palpitations.case.json';

export const catalogs = CatalogBundleSchema.parse({
  schemaVersion: 1,
  contentVersion: '3.14.0',
  evidenceSources: [
    aceGadGuidelineJson,
    apaBpdGuidelineJson,
    apaDeliriumGuidelineJson,
    asamBenzodiazepineTaperingGuidelineJson,
    bapCatatoniaGuidelineJson,
    bostwickAntidepressantFitReviewJson,
    canmatMddGuidelineJson,
    canmatMddCorrigendumJson,
    fdaAbilifyMaintenaLabelJson,
    fdaAbilifyOralLabelJson,
    fdaCitalopramLabelJson,
    fdaClozarilLabelJson,
    mishraClozapineAugmentationJson,
    mhraCitalopramQtJson,
    nhsCyclothymiaJson,
    nhsHeartPalpitationsJson,
    niceSelfHarmGuidelineJson,
    nlmRxNormCpcJson,
    roerigClozapineAugmentationJson,
    tiihonenClozapineAripiprazoleJson,
    tiihonenClozapineAugmentationDoseJson,
    vaDodBipolarGuidelineJson,
    vaDodSchizophreniaGuidelineJson,
    vaDodSuicideRiskGuidelineJson,
    villanuevaEpilepsyDepressionConsensusJson,
    whoMhgapGuidelineJson,
  ],
  diagnoses: [
    majorDepressiveDisorderDiagnosisJson,
    persistentDepressiveDisorderDiagnosisJson,
    bipolarSpectrumDiagnosisJson,
    borderlinePersonalityDisorderDiagnosisJson,
    substanceInducedMoodDiagnosisJson,
    medicationInducedAkathisiaDiagnosisJson,
    generalizedAnxietyDisorderDiagnosisJson,
    posttraumaticStressDisorderDiagnosisJson,
    schizophreniaSpectrumDisorderDiagnosisJson,
  ],
  findings: [depressedMoodFindingJson],
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
    lithiumJson,
    olanzapineJson,
    quetiapineJson,
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
  reactionConcepts: reactionConceptsJson,
  upgrades: upgradesJson,
  decor: decorJson,
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
