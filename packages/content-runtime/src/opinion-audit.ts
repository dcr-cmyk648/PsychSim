import type {
  CaseBlueprint,
  CatalogBundle,
  ClinicalRuleReview,
  SourceRequest,
} from '@psychsim/schemas';

export const DEVELOPER_OPINION_CATEGORY_LABELS = {
  workup: 'Workup and information',
  treatment: 'Treatment selection',
  safety_disposition: 'Safety and disposition',
  medication_fit: 'Medication fit',
  diagnosis: 'Diagnosis and severity',
  test_reference: 'Tests and reference data',
} as const;

export type DeveloperOpinionCategory = keyof typeof DEVELOPER_OPINION_CATEGORY_LABELS;

export interface DeveloperOpinionReferenceNeed {
  id: string;
  ruleId: string;
  category: DeveloperOpinionCategory;
  summary: string;
  evidenceQuestion: string;
  details: readonly string[];
  ownerIds: readonly string[];
  ownerContexts: ReadonlyArray<{
    ownerId: string;
    label: string;
    details: readonly string[];
  }>;
  linkedSourceRequestIds: readonly string[];
  reviewStatuses: readonly ClinicalRuleReview['status'][];
}

const ownerContextFor = (
  ownerId: string,
  blueprints: readonly CaseBlueprint[],
  catalogs: CatalogBundle,
): DeveloperOpinionReferenceNeed['ownerContexts'][number] => {
  const blueprint = blueprints.find((candidate) => candidate.id === ownerId);
  if (blueprint) {
    const diagnoses = blueprint.patientRecord.diagnoses.map((diagnosis) => {
      const label =
        catalogs.diagnoses.find((candidate) => candidate.id === diagnosis.id)?.label ??
        diagnosis.id;
      return `${label} (${diagnosis.role.replaceAll('_', ' ')})`;
    });
    const medicationLabels = blueprint.opening.knownMedicationIds.map(
      (id) => catalogs.medications.find((candidate) => candidate.id === id)?.label ?? id,
    );
    const priorTrialCount = new Set([
      ...blueprint.patientRecord.priorMedicationTrials.map((trial) => trial.id),
      ...blueprint.patientRecord.treatmentHistory.medicationTrials.map((trial) => trial.id),
    ]).size;
    return {
      ownerId,
      label: blueprint.metadata.debriefTitle,
      details: [
        `Setting: ${blueprint.opening.contextTemplate}`,
        `Internal conditions: ${diagnoses.join(' · ') || 'none recorded'}`,
        `Opening medications: ${
          blueprint.opening.medicationListStatus === 'provided'
            ? medicationLabels.join(', ')
            : blueprint.opening.medicationListStatus.replaceAll('_', ' ')
        }`,
        `Prior medication trials: ${priorTrialCount}`,
        `Relevant patient tags: ${blueprint.patientRecord.clinicalTagIds.join(', ') || 'none'}`,
      ],
    };
  }
  const medication = catalogs.medications.find((candidate) => candidate.id === ownerId);
  if (medication) {
    return {
      ownerId,
      label: medication.label,
      details: [
        `Medication classes: ${medication.classes.join(' · ')}`,
        `Catalog tags: ${medication.tags.join(', ')}`,
      ],
    };
  }
  const diagnosis = catalogs.diagnoses.find((candidate) => candidate.id === ownerId);
  if (diagnosis) {
    return {
      ownerId,
      label: diagnosis.label,
      details: [
        diagnosis.description,
        `Medical review: ${diagnosis.medicalReviewStatus.replaceAll('_', ' ')}`,
      ],
    };
  }
  const test = catalogs.tests.find(
    (candidate) => candidate.id === ownerId || candidate.actionId === ownerId,
  );
  if (test) {
    return {
      ownerId,
      label: test.label,
      details: [`Test action: ${test.actionId}`, `Generator: ${test.generator.type}`],
    };
  }
  return { ownerId, label: ownerId, details: ['No patient-specific owner context is available.'] };
};

interface OpinionCandidate {
  ruleId: string;
  category: DeveloperOpinionCategory;
  summary: string;
  evidenceQuestion: string;
  detail: string;
  ownerId: string;
  sourceUseNoteIds: readonly string[];
  reviewStatus: ClinicalRuleReview['status'];
  requestTargetIds?: readonly string[];
}

const uniqueSorted = (values: readonly string[]): string[] => [...new Set(values)].sort();

const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value}`;

const categoryForScoreComponent = (
  component: CaseBlueprint['scoreRules'][number]['component'],
): DeveloperOpinionCategory => {
  switch (component) {
    case 'workup':
    case 'efficiency':
      return 'workup';
    case 'safety':
    case 'disposition':
      return 'safety_disposition';
    case 'medication_selection':
    case 'medication_discontinuation':
    case 'nonmedication':
      return 'treatment';
  }
};

const collectFormalContributionIds = (
  blueprints: readonly CaseBlueprint[],
  catalogs: CatalogBundle,
): Set<string> =>
  new Set(
    [
      ...blueprints.flatMap((blueprint) => blueprint.patientRecord.sourceUseNotes),
      ...catalogs.medications.flatMap((medication) => medication.sourceUseNotes),
      ...catalogs.diagnoses.flatMap((diagnosis) => diagnosis.sourceUseNotes),
    ]
      .filter((contribution) => contribution.authority === 'formal_publication')
      .map((contribution) => contribution.id),
  );

const caseCandidates = (blueprint: CaseBlueprint): OpinionCandidate[] => {
  const candidates: OpinionCandidate[] = [];
  const add = (
    candidate: Omit<OpinionCandidate, 'ownerId' | 'reviewStatus'> & {
      review: ClinicalRuleReview;
    },
  ) => {
    candidates.push({
      ...candidate,
      ownerId: blueprint.id,
      reviewStatus: candidate.review.status,
      sourceUseNoteIds: uniqueSorted([
        ...candidate.sourceUseNoteIds,
        ...candidate.review.sourceUseNoteIds,
      ]),
    });
  };
  const treatmentReference = blueprint.patientRecord.treatmentReference;
  add({
    ruleId: treatmentReference.id,
    category: 'treatment',
    summary: `Overall treatment reference for ${blueprint.metadata.title}`,
    evidenceQuestion:
      'Which current guideline or comparative source supports the broad accepted treatment routes for this patient snapshot?',
    detail:
      'The clinical direction needs support; the exact point mapping and database-plan total remain Developer game balance.',
    sourceUseNoteIds: [],
    review: treatmentReference.review,
  });
  for (const tagSet of treatmentReference.acceptedMedicationTagSets) {
    add({
      ruleId: tagSet.id,
      category: 'treatment',
      summary: `Accepted medication family: ${tagSet.allOfTagIds.join(' + ')}`,
      evidenceQuestion: `Which source supports treating this medication family as ${tagSet.baselineGrade.replaceAll('_', ' ')} for this presentation?`,
      detail: `Current rule accepts medications carrying ${tagSet.allOfTagIds.join(', ')}. Exact point differences remain game balance.`,
      sourceUseNoteIds: [],
      review: tagSet.review,
    });
  }
  for (const objective of blueprint.workupObjectives) {
    add({
      ruleId: objective.id,
      category: 'workup',
      summary: objective.label,
      evidenceQuestion: `When should “${objective.label}” be required, optional, or low value for this presentation?`,
      detail: `Current rule: ${objective.importance.replaceAll('_', ' ')}; obtained ${signed(objective.points)} points; omitted ${signed(objective.omissionPenalty)} points. A source should support the clinical relevance, not dictate the exact points.`,
      sourceUseNoteIds: [],
      review: objective.review,
    });
  }
  for (const grade of blueprint.treatmentGrades) {
    add({
      ruleId: grade.id,
      category: grade.grade === 'harmful' ? 'safety_disposition' : ('treatment' as const),
      summary: grade.label,
      evidenceQuestion: `How should “${grade.label}” be clinically classified for this presentation?`,
      detail: `${grade.explanation} Current grade: ${grade.grade.replaceAll('_', ' ')}; base ${signed(grade.baseCarePoints)} points. The grade needs support; its magnitude remains game balance.`,
      sourceUseNoteIds: [],
      review: grade.review,
    });
  }
  for (const pathway of blueprint.treatmentPathways) {
    add({
      ruleId: pathway.id,
      category: pathway.grade === 'harmful' ? 'safety_disposition' : 'treatment',
      summary: pathway.label,
      evidenceQuestion: `Which source supports “${pathway.label}” as ${pathway.accepted ? 'an accepted' : 'a nonaccepted'} care route?`,
      detail: `${pathway.explanation} Current grade: ${pathway.grade.replaceAll('_', ' ')}; workup baseline ${pathway.workupCostPar} points.`,
      sourceUseNoteIds: [],
      review: pathway.review,
    });
    for (const requirement of pathway.conditionalRequirements) {
      add({
        ruleId: `${pathway.id}.${requirement.objectiveId}`,
        category: requirement.safetyCritical ? 'safety_disposition' : 'workup',
        summary: `${pathway.label}: conditional ${requirement.objectiveId}`,
        evidenceQuestion: `When should ${requirement.objectiveId} be required specifically before using “${pathway.label}”?`,
        detail: `${requirement.explanationMet} Missing: ${requirement.explanationMissing} Current effects: ${signed(requirement.pointsIfMet)} / ${signed(requirement.pointsIfMissing)} points.`,
        sourceUseNoteIds: [],
        review: requirement.review,
        requestTargetIds: [pathway.id, requirement.objectiveId],
      });
    }
  }
  for (const rule of blueprint.scoreRules) {
    add({
      ruleId: rule.id,
      category: categoryForScoreComponent(rule.component),
      summary: rule.label,
      evidenceQuestion: `Which source supports the clinical direction of “${rule.label}” in this patient state?`,
      detail: `${rule.explanationIfTrue} Alternative outcome: ${rule.explanationIfFalse} Current effects: ${signed(rule.pointsIfTrue)} / ${signed(rule.pointsIfFalse)} points; exact magnitudes remain game balance.`,
      sourceUseNoteIds: [],
      review: rule.review,
    });
  }
  return candidates;
};

const medicationCandidates = (catalogs: CatalogBundle): OpinionCandidate[] =>
  catalogs.medications.flatMap((medication) => [
    ...medication.fitModifiers.map<OpinionCandidate>((modifier) => ({
      ruleId: modifier.id,
      category: 'medication_fit',
      summary: `${medication.label}: ${modifier.effect.replaceAll('_', ' ')} fit`,
      evidenceQuestion: `What evidence supports this patient feature changing the relative fit of ${medication.label}?`,
      detail: `${modifier.explanation} Current modifier: ${signed(modifier.pointDelta)} points for ${modifier.patientTagIds.join(', ')}; the direction needs support and the magnitude remains game balance.`,
      ownerId: medication.id,
      sourceUseNoteIds: uniqueSorted([
        ...modifier.sourceUseNoteIds,
        ...modifier.review.sourceUseNoteIds,
      ]),
      reviewStatus: modifier.review.status,
      requestTargetIds: [medication.id],
    })),
    ...medication.authorOverrides.map<OpinionCandidate>((override) => ({
      ruleId: override.id,
      category: 'medication_fit',
      summary: `${medication.label}: preserved Developer opinion`,
      evidenceQuestion: `What evidence supports this proposed ${medication.label} fit adjustment?`,
      detail: `${override.explanation} Proposed adjustment: ${signed(override.pointDelta)} points for ${override.patientTagIds.join(', ')}. This remains an inactive author override until reviewed.`,
      ownerId: medication.id,
      sourceUseNoteIds: uniqueSorted([
        ...override.sourceUseNoteIds,
        ...override.review.sourceUseNoteIds,
      ]),
      reviewStatus: override.review.status,
      requestTargetIds: [medication.id],
    })),
  ]);

const diagnosisCandidates = (catalogs: CatalogBundle): OpinionCandidate[] =>
  catalogs.diagnoses.flatMap((diagnosis) => {
    const ruleCandidate = (
      rule: (typeof diagnosis.baseRules)[number],
      ownerId: string,
    ): OpinionCandidate => ({
      ruleId: rule.id,
      category:
        rule.domain === 'safety' || rule.domain === 'disposition'
          ? 'safety_disposition'
          : rule.domain === 'assessment' || rule.domain === 'workup'
            ? 'diagnosis'
            : 'treatment',
      summary: `${diagnosis.label}: ${rule.label}`,
      evidenceQuestion: `Which diagnostic or treatment source supports this ${diagnosis.label} recommendation stance?`,
      detail: `${rule.rationale} Current stance: ${rule.stance}.`,
      ownerId,
      sourceUseNoteIds: [...rule.review.sourceUseNoteIds],
      reviewStatus: rule.review.status,
      requestTargetIds: [diagnosis.id],
    });
    const candidates: OpinionCandidate[] = diagnosis.baseRules.map((rule) =>
      ruleCandidate(rule, diagnosis.id),
    );
    if (diagnosis.severityAxis) {
      for (const level of diagnosis.severityAxis.levels) {
        candidates.push({
          ruleId: level.id,
          category: 'diagnosis',
          summary: `${diagnosis.label}: ${level.label} threshold`,
          evidenceQuestion: `Which current diagnostic standard operationalizes the ${level.label} threshold for generated patients?`,
          detail: `Generation is ${level.generationStatus.replaceAll('_', ' ')}. Constraints must be source-supported before activation.`,
          ownerId: diagnosis.id,
          sourceUseNoteIds: [...level.review.sourceUseNoteIds],
          reviewStatus: level.review.status,
          requestTargetIds: [diagnosis.id, diagnosis.severityAxis.id],
        });
        candidates.push(...level.rules.map((rule) => ruleCandidate(rule, level.id)));
      }
    }
    for (const specifier of diagnosis.specifiers) {
      candidates.push(...specifier.rules.map((rule) => ruleCandidate(rule, specifier.id)));
    }
    for (const relationship of diagnosis.comorbidityRelationships) {
      candidates.push({
        ruleId: `${diagnosis.id}.${relationship.diagnosisId}`,
        category: 'diagnosis',
        summary: `${diagnosis.label}: ${relationship.relationship.replaceAll('_', ' ')} with ${relationship.diagnosisId}`,
        evidenceQuestion:
          'Which diagnostic source supports this compatibility or overlap relationship?',
        detail:
          'The relationship constrains generated condition composition; game-generation weight is not presented as epidemiologic prevalence.',
        ownerId: diagnosis.id,
        sourceUseNoteIds: [...relationship.review.sourceUseNoteIds],
        reviewStatus: relationship.review.status,
        requestTargetIds: [diagnosis.id, relationship.diagnosisId],
      });
    }
    return candidates;
  });

const testCandidates = (catalogs: CatalogBundle): OpinionCandidate[] => [
  ...catalogs.referenceIntervalSets.map<OpinionCandidate>((intervalSet) => ({
    ruleId: intervalSet.id,
    category: 'test_reference',
    summary: intervalSet.label,
    evidenceQuestion:
      'Which laboratory, manufacturer, or published source supports this reference-interval policy and unit convention?',
    detail: `${intervalSet.referenceIntervalPolicy} Current authority: ${intervalSet.numericRangeAuthority.replaceAll('_', ' ')}.`,
    ownerId: intervalSet.id,
    sourceUseNoteIds: [...intervalSet.sourceUseNoteIds],
    reviewStatus: intervalSet.medicalReviewStatus,
  })),
  ...catalogs.tests.flatMap((test) =>
    test.generator.type === 'numeric_panel'
      ? test.generator.profiles.flatMap<OpinionCandidate>((profile) => [
          {
            ruleId: profile.id,
            category: 'test_reference',
            summary: `${test.label}: ${profile.referenceIntervalLabel}`,
            evidenceQuestion:
              'Which source supports this population-specific reference profile and bounded incidental-abnormality behavior?',
            detail: `Reference set ${profile.referenceIntervalSetId}; incidental flag probability ${profile.incidentalAbnormalProbability}. The probability is a game parameter, while the ranges require reference support.`,
            ownerId: test.id,
            sourceUseNoteIds: uniqueSorted([
              ...test.sourceUseNoteIds,
              ...profile.review.sourceUseNoteIds,
            ]),
            reviewStatus: profile.review.status,
            requestTargetIds: [test.id, test.actionId],
          },
          ...profile.components.map<OpinionCandidate>((component) => ({
            ruleId: component.id,
            category: 'test_reference',
            summary: `${test.label}: ${component.label}`,
            evidenceQuestion: `Which source supports the displayed unit and reference interval for ${component.label}?`,
            detail: `Reference ${component.referenceRange.minimum}–${component.referenceRange.maximum} ${component.unit}; normal generation ${component.normalGenerationRange.minimum}–${component.normalGenerationRange.maximum} ${component.unit}.`,
            ownerId: test.id,
            sourceUseNoteIds: uniqueSorted([
              ...test.sourceUseNoteIds,
              ...profile.review.sourceUseNoteIds,
              ...component.review.sourceUseNoteIds,
            ]),
            reviewStatus: component.review.status,
            requestTargetIds: [test.id, test.actionId, profile.id],
          })),
        ])
      : [],
  ),
];

export const buildDeveloperOpinionReferenceNeeds = (
  blueprints: readonly CaseBlueprint[],
  catalogs: CatalogBundle,
  sourceRequests: readonly SourceRequest[],
): readonly DeveloperOpinionReferenceNeed[] => {
  const formalContributionIds = collectFormalContributionIds(blueprints, catalogs);
  const candidates = [
    ...blueprints.flatMap(caseCandidates),
    ...medicationCandidates(catalogs),
    ...diagnosisCandidates(catalogs),
    ...testCandidates(catalogs),
  ].filter(
    (candidate) => !candidate.sourceUseNoteIds.some((noteId) => formalContributionIds.has(noteId)),
  );
  const grouped = new Map<
    string,
    Omit<
      DeveloperOpinionReferenceNeed,
      'details' | 'ownerIds' | 'ownerContexts' | 'linkedSourceRequestIds' | 'reviewStatuses'
    > & {
      details: Set<string>;
      ownerIds: Set<string>;
      linkedSourceRequestIds: Set<string>;
      reviewStatuses: Set<ClinicalRuleReview['status']>;
    }
  >();
  for (const candidate of candidates) {
    const key = `${candidate.category}:${candidate.ruleId}`;
    const requestTargetIds = new Set([candidate.ruleId, ...(candidate.requestTargetIds ?? [])]);
    const linkedSourceRequestIds = sourceRequests
      .filter((request) =>
        request.targetContentIds.some((targetId) => requestTargetIds.has(targetId)),
      )
      .map((request) => request.id);
    const existing = grouped.get(key);
    if (existing) {
      existing.details.add(candidate.detail);
      existing.ownerIds.add(candidate.ownerId);
      linkedSourceRequestIds.forEach((id) => existing.linkedSourceRequestIds.add(id));
      existing.reviewStatuses.add(candidate.reviewStatus);
      continue;
    }
    grouped.set(key, {
      id: `opinion-need.${candidate.ruleId}`,
      ruleId: candidate.ruleId,
      category: candidate.category,
      summary: candidate.summary,
      evidenceQuestion: candidate.evidenceQuestion,
      details: new Set([candidate.detail]),
      ownerIds: new Set([candidate.ownerId]),
      linkedSourceRequestIds: new Set(linkedSourceRequestIds),
      reviewStatuses: new Set([candidate.reviewStatus]),
    });
  }
  return [...grouped.values()]
    .map((entry) => ({
      ...entry,
      details: uniqueSorted([...entry.details]),
      ownerIds: uniqueSorted([...entry.ownerIds]),
      ownerContexts: uniqueSorted([...entry.ownerIds]).map((ownerId) =>
        ownerContextFor(ownerId, blueprints, catalogs),
      ),
      linkedSourceRequestIds: uniqueSorted([...entry.linkedSourceRequestIds]),
      reviewStatuses: uniqueSorted([...entry.reviewStatuses]) as ClinicalRuleReview['status'][],
    }))
    .sort(
      (left, right) =>
        left.category.localeCompare(right.category) ||
        left.summary.localeCompare(right.summary) ||
        left.ruleId.localeCompare(right.ruleId),
    );
};
