import {
  MedicationIdentityDefinitionSchema,
  type MedicationIdentityDefinition,
} from '@psychsim/schemas';

import amitriptylineJson from '../../../content/catalogs/medications/identities/amitriptyline.identity.json';
import aripiprazoleJson from '../../../content/catalogs/medications/identities/aripiprazole.identity.json';
import atomoxetineJson from '../../../content/catalogs/medications/identities/atomoxetine.identity.json';
import benztropineJson from '../../../content/catalogs/medications/identities/benztropine.identity.json';
import bupropionJson from '../../../content/catalogs/medications/identities/bupropion.identity.json';
import buspironeJson from '../../../content/catalogs/medications/identities/buspirone.identity.json';
import carbamazepineJson from '../../../content/catalogs/medications/identities/carbamazepine.identity.json';
import cariprazineJson from '../../../content/catalogs/medications/identities/cariprazine.identity.json';
import citalopramJson from '../../../content/catalogs/medications/identities/citalopram.identity.json';
import clonidineJson from '../../../content/catalogs/medications/identities/clonidine.identity.json';
import clonazepamJson from '../../../content/catalogs/medications/identities/clonazepam.identity.json';
import clozapineJson from '../../../content/catalogs/medications/identities/clozapine.identity.json';
import desipramineJson from '../../../content/catalogs/medications/identities/desipramine.identity.json';
import desvenlafaxineJson from '../../../content/catalogs/medications/identities/desvenlafaxine.identity.json';
import dexmedetomidineJson from '../../../content/catalogs/medications/identities/dexmedetomidine.identity.json';
import diazepamJson from '../../../content/catalogs/medications/identities/diazepam.identity.json';
import diphenhydramineJson from '../../../content/catalogs/medications/identities/diphenhydramine.identity.json';
import doxazosinJson from '../../../content/catalogs/medications/identities/doxazosin.identity.json';
import doxepinJson from '../../../content/catalogs/medications/identities/doxepin.identity.json';
import doxylamineJson from '../../../content/catalogs/medications/identities/doxylamine.identity.json';
import duloxetineJson from '../../../content/catalogs/medications/identities/duloxetine.identity.json';
import escitalopramJson from '../../../content/catalogs/medications/identities/escitalopram.identity.json';
import esketamineJson from '../../../content/catalogs/medications/identities/esketamine.identity.json';
import fluoxetineJson from '../../../content/catalogs/medications/identities/fluoxetine.identity.json';
import fluvoxamineJson from '../../../content/catalogs/medications/identities/fluvoxamine.identity.json';
import gabapentinJson from '../../../content/catalogs/medications/identities/gabapentin.identity.json';
import haloperidolJson from '../../../content/catalogs/medications/identities/haloperidol.identity.json';
import hydroxyzineJson from '../../../content/catalogs/medications/identities/hydroxyzine.identity.json';
import lamotrigineJson from '../../../content/catalogs/medications/identities/lamotrigine.identity.json';
import lithiumJson from '../../../content/catalogs/medications/identities/lithium.identity.json';
import lorazepamJson from '../../../content/catalogs/medications/identities/lorazepam.identity.json';
import lurasidoneJson from '../../../content/catalogs/medications/identities/lurasidone.identity.json';
import ketamineJson from '../../../content/catalogs/medications/identities/ketamine.identity.json';
import melatoninJson from '../../../content/catalogs/medications/identities/melatonin.identity.json';
import memantineJson from '../../../content/catalogs/medications/identities/memantine.identity.json';
import mirtazapineJson from '../../../content/catalogs/medications/identities/mirtazapine.identity.json';
import nefazodoneJson from '../../../content/catalogs/medications/identities/nefazodone.identity.json';
import nortriptylineJson from '../../../content/catalogs/medications/identities/nortriptyline.identity.json';
import olanzapineJson from '../../../content/catalogs/medications/identities/olanzapine.identity.json';
import omega3FattyAcidsJson from '../../../content/catalogs/medications/identities/omega-3-fatty-acids.identity.json';
import paliperidoneJson from '../../../content/catalogs/medications/identities/paliperidone.identity.json';
import paroxetineJson from '../../../content/catalogs/medications/identities/paroxetine.identity.json';
import prazosinJson from '../../../content/catalogs/medications/identities/prazosin.identity.json';
import propranololJson from '../../../content/catalogs/medications/identities/propranolol.identity.json';
import quetiapineJson from '../../../content/catalogs/medications/identities/quetiapine.identity.json';
import risperidoneJson from '../../../content/catalogs/medications/identities/risperidone.identity.json';
import selegilineJson from '../../../content/catalogs/medications/identities/selegiline.identity.json';
import sertralineJson from '../../../content/catalogs/medications/identities/sertraline.identity.json';
import trazodoneJson from '../../../content/catalogs/medications/identities/trazodone.identity.json';
import valproateJson from '../../../content/catalogs/medications/identities/valproate.identity.json';
import venlafaxineJson from '../../../content/catalogs/medications/identities/venlafaxine.identity.json';
import viloxazineJson from '../../../content/catalogs/medications/identities/viloxazine.identity.json';
import ziprasidoneJson from '../../../content/catalogs/medications/identities/ziprasidone.identity.json';

const identityJson = [
  amitriptylineJson,
  aripiprazoleJson,
  atomoxetineJson,
  benztropineJson,
  bupropionJson,
  buspironeJson,
  carbamazepineJson,
  cariprazineJson,
  citalopramJson,
  clonidineJson,
  clonazepamJson,
  clozapineJson,
  desipramineJson,
  desvenlafaxineJson,
  dexmedetomidineJson,
  diazepamJson,
  diphenhydramineJson,
  doxazosinJson,
  doxepinJson,
  doxylamineJson,
  duloxetineJson,
  escitalopramJson,
  esketamineJson,
  fluoxetineJson,
  fluvoxamineJson,
  gabapentinJson,
  haloperidolJson,
  hydroxyzineJson,
  lamotrigineJson,
  lithiumJson,
  lorazepamJson,
  lurasidoneJson,
  ketamineJson,
  melatoninJson,
  memantineJson,
  mirtazapineJson,
  nefazodoneJson,
  nortriptylineJson,
  olanzapineJson,
  omega3FattyAcidsJson,
  paliperidoneJson,
  paroxetineJson,
  prazosinJson,
  propranololJson,
  quetiapineJson,
  risperidoneJson,
  selegilineJson,
  sertralineJson,
  trazodoneJson,
  valproateJson,
  venlafaxineJson,
  viloxazineJson,
  ziprasidoneJson,
] as const;

export const medicationIdentities: readonly MedicationIdentityDefinition[] = identityJson
  .map((entry) => MedicationIdentityDefinitionSchema.parse(entry))
  .sort((left, right) => left.label.localeCompare(right.label));
