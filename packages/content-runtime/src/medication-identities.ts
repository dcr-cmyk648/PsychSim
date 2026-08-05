import {
  MedicationIdentityDefinitionSchema,
  type MedicationIdentityDefinition,
} from '@psychsim/schemas';

import { rawMedicationIdentityJson } from './medication-identities.generated';

export const medicationIdentities: readonly MedicationIdentityDefinition[] =
  rawMedicationIdentityJson
    .map((entry) => MedicationIdentityDefinitionSchema.parse(entry))
    .sort((left, right) => left.label.localeCompare(right.label));
