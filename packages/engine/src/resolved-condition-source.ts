import {
  ResolvedConditionSourceSchema,
  type ConditionState,
  type ResolvedConditionSource,
  type ResolvedConditionSourceReference,
  type ResolvedTemplateConditionBinding,
  type TemplateConditionSelectionConflict,
} from '@psychsim/schemas';

import { verifyOptionalComorbidityBridgeIntegrity } from './optional-comorbidity-budget-bridge';
import { verifyTemplateConditionSelectionIntegrity } from './template-condition-selector';

export type ResolvedConditionSourceIntegrityResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly source: ResolvedConditionSource;
        readonly sourceRef: ResolvedConditionSourceReference;
        readonly conditionStates: readonly ConditionState[];
        readonly conditionBindings: readonly ResolvedTemplateConditionBinding[];
        readonly conflicts: readonly TemplateConditionSelectionConflict[];
      };
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'INVALID_SCHEMA' | 'INVALID_SOURCE_ARTIFACT';
        readonly message: string;
      };
    };

const issuesText = (issues: readonly { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');

/**
 * Verifies one genuine source artifact and exposes only its common resolved
 * condition projection. It never synthesizes selection provenance for another
 * source kind.
 */
export const verifyResolvedConditionSourceIntegrity = (
  input: unknown,
): ResolvedConditionSourceIntegrityResult => {
  const parsed = ResolvedConditionSourceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: issuesText(parsed.error.issues),
      },
    };
  }
  const source = parsed.data;
  const sourceIntegrity =
    source.sourceKind === 'template_condition_selection'
      ? verifyTemplateConditionSelectionIntegrity(source.artifact)
      : verifyOptionalComorbidityBridgeIntegrity(source.artifact);
  if (!sourceIntegrity.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SOURCE_ARTIFACT',
        message: `${sourceIntegrity.error.code}: ${sourceIntegrity.error.message}`,
      },
    };
  }
  const artifact = sourceIntegrity.value;
  return {
    ok: true,
    value: {
      source,
      sourceRef: {
        sourceKind: source.sourceKind,
        id: artifact.id,
        payloadFingerprint: artifact.payloadFingerprint,
        templateRef: { ...artifact.templateRef },
        templateFingerprint: artifact.templateFingerprint,
      } as ResolvedConditionSourceReference,
      conditionStates: artifact.conditionStates,
      conditionBindings: artifact.conditionBindings,
      conflicts: artifact.conflicts,
    },
  };
};
