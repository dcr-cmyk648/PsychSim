import {
  SupplementIdentityDefinitionSchema,
  type SupplementIdentityDefinition,
} from '@psychsim/schemas';

import ashwagandhaJson from '../../../content/catalogs/supplements/identities/ashwagandha.identity.json';
import lavenderOilJson from '../../../content/catalogs/supplements/identities/lavender-oil.identity.json';
import lTheanineJson from '../../../content/catalogs/supplements/identities/l-theanine.identity.json';
import magnesiumJson from '../../../content/catalogs/supplements/identities/magnesium.identity.json';
import sameJson from '../../../content/catalogs/supplements/identities/s-adenosylmethionine.identity.json';
import saffronExtractJson from '../../../content/catalogs/supplements/identities/saffron-extract.identity.json';

const identityJson = [
  ashwagandhaJson,
  lavenderOilJson,
  lTheanineJson,
  magnesiumJson,
  sameJson,
  saffronExtractJson,
] as const;

export const supplementIdentities: readonly SupplementIdentityDefinition[] = identityJson
  .map((entry) => SupplementIdentityDefinitionSchema.parse(entry))
  .sort((left, right) => left.label.localeCompare(right.label));
