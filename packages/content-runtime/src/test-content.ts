import { CaseBlueprintSchema } from '@psychsim/schemas';

import advancedPrototypeCaseJson from '../../../content/cases/review/restless-after-augmentation.case.json';

/** Review-only fixture for engine coverage. Never export this from the runtime entry point. */
export const advancedPrototypeCaseBlueprint = CaseBlueprintSchema.parse(advancedPrototypeCaseJson);
