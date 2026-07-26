import {
  MedicationIdentityDefinitionSchema,
  type MedicationIdentityDefinition,
} from '@psychsim/schemas';

import aripiprazoleJson from '../../../content/catalogs/medications/identities/aripiprazole.identity.json';
import benztropineJson from '../../../content/catalogs/medications/identities/benztropine.identity.json';
import bupropionJson from '../../../content/catalogs/medications/identities/bupropion.identity.json';
import buspironeJson from '../../../content/catalogs/medications/identities/buspirone.identity.json';
import carbamazepineJson from '../../../content/catalogs/medications/identities/carbamazepine.identity.json';
import cariprazineJson from '../../../content/catalogs/medications/identities/cariprazine.identity.json';
import citalopramJson from '../../../content/catalogs/medications/identities/citalopram.identity.json';
import clonazepamJson from '../../../content/catalogs/medications/identities/clonazepam.identity.json';
import clozapineJson from '../../../content/catalogs/medications/identities/clozapine.identity.json';
import desvenlafaxineJson from '../../../content/catalogs/medications/identities/desvenlafaxine.identity.json';
import diazepamJson from '../../../content/catalogs/medications/identities/diazepam.identity.json';
import duloxetineJson from '../../../content/catalogs/medications/identities/duloxetine.identity.json';
import escitalopramJson from '../../../content/catalogs/medications/identities/escitalopram.identity.json';
import fluoxetineJson from '../../../content/catalogs/medications/identities/fluoxetine.identity.json';
import fluvoxamineJson from '../../../content/catalogs/medications/identities/fluvoxamine.identity.json';
import haloperidolJson from '../../../content/catalogs/medications/identities/haloperidol.identity.json';
import hydroxyzineJson from '../../../content/catalogs/medications/identities/hydroxyzine.identity.json';
import lamotrigineJson from '../../../content/catalogs/medications/identities/lamotrigine.identity.json';
import lithiumJson from '../../../content/catalogs/medications/identities/lithium.identity.json';
import lorazepamJson from '../../../content/catalogs/medications/identities/lorazepam.identity.json';
import lurasidoneJson from '../../../content/catalogs/medications/identities/lurasidone.identity.json';
import mirtazapineJson from '../../../content/catalogs/medications/identities/mirtazapine.identity.json';
import olanzapineJson from '../../../content/catalogs/medications/identities/olanzapine.identity.json';
import paliperidoneJson from '../../../content/catalogs/medications/identities/paliperidone.identity.json';
import paroxetineJson from '../../../content/catalogs/medications/identities/paroxetine.identity.json';
import prazosinJson from '../../../content/catalogs/medications/identities/prazosin.identity.json';
import propranololJson from '../../../content/catalogs/medications/identities/propranolol.identity.json';
import quetiapineJson from '../../../content/catalogs/medications/identities/quetiapine.identity.json';
import risperidoneJson from '../../../content/catalogs/medications/identities/risperidone.identity.json';
import sertralineJson from '../../../content/catalogs/medications/identities/sertraline.identity.json';
import trazodoneJson from '../../../content/catalogs/medications/identities/trazodone.identity.json';
import venlafaxineJson from '../../../content/catalogs/medications/identities/venlafaxine.identity.json';
import ziprasidoneJson from '../../../content/catalogs/medications/identities/ziprasidone.identity.json';

const identityJson = [
  aripiprazoleJson,
  benztropineJson,
  bupropionJson,
  buspironeJson,
  carbamazepineJson,
  cariprazineJson,
  citalopramJson,
  clonazepamJson,
  clozapineJson,
  desvenlafaxineJson,
  diazepamJson,
  duloxetineJson,
  escitalopramJson,
  fluoxetineJson,
  fluvoxamineJson,
  haloperidolJson,
  hydroxyzineJson,
  lamotrigineJson,
  lithiumJson,
  lorazepamJson,
  lurasidoneJson,
  mirtazapineJson,
  olanzapineJson,
  paliperidoneJson,
  paroxetineJson,
  prazosinJson,
  propranololJson,
  quetiapineJson,
  risperidoneJson,
  sertralineJson,
  trazodoneJson,
  venlafaxineJson,
  ziprasidoneJson,
] as const;

export const medicationIdentities: readonly MedicationIdentityDefinition[] = identityJson
  .map((entry) => MedicationIdentityDefinitionSchema.parse(entry))
  .sort((left, right) => left.label.localeCompare(right.label));
