import { ContentRegistrySchema } from '@psychsim/schemas';

import registryJson from '../../../content/registry.json';

/**
 * Developer-side content graph. This module is intentionally not exported by the
 * browser runtime entry point because it includes review and authoring records.
 */
export const contentRegistry = ContentRegistrySchema.parse(registryJson);
