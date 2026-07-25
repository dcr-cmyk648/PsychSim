import type { CaseRuleAudit } from '@psychsim/content-runtime';
import { focusCaseRuleAudit } from '@psychsim/content-runtime';
import { LazyDisclosure } from './LazyDisclosure';

interface CaseRuleAuditViewProps {
  audit: CaseRuleAudit;
  targetContentIds: readonly string[];
}

const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value}`;
const words = (value: string): string => value.replaceAll('_', ' ');

const ReviewLine = ({
  review,
}: {
  review: { status: string; sourceUseNoteIds: readonly string[] };
}) => (
  <small className="audit-provenance">
    {words(review.status)} ·{' '}
    {review.sourceUseNoteIds.length > 0
      ? `source-use ${review.sourceUseNoteIds.join(', ')}`
      : 'Expert opinion / no formal contribution linked'}
  </small>
);

export function CaseRuleAuditView({ audit, targetContentIds }: CaseRuleAuditViewProps) {
  const focused = focusCaseRuleAudit(audit, targetContentIds);
  const focusedCount =
    focused.investigations.length +
    focused.treatmentGrades.length +
    focused.medicationFitModifiers.length +
    focused.treatmentPathways.length +
    focused.scoreRules.length;

  return (
    <LazyDisclosure
      className="case-rule-audit"
      summary={
        <>
          Current executable values ·{' '}
          {focused.mode === 'targeted' ? `${focusedCount} targeted rules` : 'complete case audit'}
        </>
      }
    >
      {() => (
        <div className="case-rule-audit-body">
          <p className="audit-disclaimer">
            Read-only snapshot from case version {audit.contentVersion}. These are current game
            values, not medically approved recommendations.
          </p>

          <dl className="audit-plan-summary">
            <div>
              <dt>Database-plan care</dt>
              <dd>{signed(audit.databasePlan.carePoints)} pts</dd>
            </div>
            <div>
              <dt>Workup par</dt>
              <dd>{audit.databasePlan.workupCostPar} pts</dd>
            </div>
            <div>
              <dt>Base reimbursement</dt>
              <dd>{audit.databasePlan.baseReimbursement} pts</dd>
            </div>
            <div>
              <dt>Case bonuses</dt>
              <dd>
                {signed(audit.databasePlan.complexityBonus + audit.databasePlan.challengeBonus)} pts
              </dd>
            </div>
          </dl>

          {focused.criticalRules.length > 0 ? (
            <section className="audit-rule-group audit-critical">
              <h4>Cannot-miss and score-cap rules</h4>
              <ul>
                {focused.criticalRules.map((rule) => (
                  <li key={rule.id}>
                    <strong>{rule.label}</strong>
                    <span>{rule.consequence}</span>
                    <code>{rule.id}</code>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {focused.investigations.length > 0 ? (
            <section className="audit-rule-group">
              <h4>Investigations and workup</h4>
              <div className="audit-row-list">
                {focused.investigations.map((rule) => (
                  <article className="audit-row" key={rule.id}>
                    <header>
                      <strong>{rule.label}</strong>
                      <span>
                        {words(rule.importance)}
                        {rule.requiredByDefault ? ' · required by default' : ' · path-dependent'}
                      </span>
                    </header>
                    <dl>
                      <div>
                        <dt>Clinical points</dt>
                        <dd>
                          obtained {signed(rule.pointsIfObtained)} · omitted{' '}
                          {signed(rule.pointsIfOmitted)}
                        </dd>
                      </div>
                      <div>
                        <dt>Action</dt>
                        <dd>{rule.actionLabels.join(' OR ') || rule.condition}</dd>
                      </div>
                      {rule.fulfillment.map((method) => (
                        <div key={`${rule.id}.${method.actionId}`}>
                          <dt>Current cost</dt>
                          <dd>
                            {method.methodLabel} · {words(method.methodKind)} ·{' '}
                            {method.operatingCost} pts
                          </dd>
                        </div>
                      ))}
                      {rule.conditionalEffects.map((effect) => (
                        <div key={`${rule.id}.${effect.pathwayId}`}>
                          <dt>
                            {effect.safetyCritical ? 'Safety-critical path' : 'Path modifier'}
                          </dt>
                          <dd>
                            {effect.pathwayLabel}: met {signed(effect.pointsIfMet)} · missing{' '}
                            {signed(effect.pointsIfMissing)}
                          </dd>
                        </div>
                      ))}
                      <div>
                        <dt>Predicate</dt>
                        <dd>{rule.condition}</dd>
                      </div>
                    </dl>
                    <ReviewLine review={rule.review} />
                    <code>{rule.id}</code>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {focused.treatmentGrades.length > 0 ? (
            <section className="audit-rule-group">
              <h4>Treatment base values</h4>
              <div className="audit-row-list">
                {focused.treatmentGrades.map((rule) => (
                  <article className="audit-row" key={rule.id}>
                    <header>
                      <strong>{rule.label}</strong>
                      <span>
                        {words(rule.grade)} · base {signed(rule.baseCarePoints)} pts
                      </span>
                    </header>
                    <p>
                      <b>When:</b> {rule.condition}
                    </p>
                    <p>{rule.explanation}</p>
                    <ReviewLine review={rule.review} />
                    <code>{rule.id}</code>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {focused.medicationFitModifiers.length > 0 ? (
            <section className="audit-rule-group">
              <h4>Medication fit modifiers</h4>
              <div className="audit-row-list">
                {focused.medicationFitModifiers.map((rule) => (
                  <article className="audit-row" key={rule.id}>
                    <header>
                      <strong>{rule.medicationLabel}</strong>
                      <span>
                        {words(rule.effect)} {signed(rule.pointDelta)} pts ·{' '}
                        {rule.appliesToCurrentPatient
                          ? 'applies to current patient tags'
                          : 'does not apply to current patient tags'}
                      </span>
                    </header>
                    <p>Requires tags: {rule.patientTagIds.join(', ')}</p>
                    <p>{rule.explanation}</p>
                    <ReviewLine review={rule.review} />
                    <code>{rule.id}</code>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {focused.treatmentPathways.length > 0 ? (
            <section className="audit-rule-group">
              <h4>Treatment pathways</h4>
              <div className="audit-row-list">
                {focused.treatmentPathways.map((rule) => (
                  <article className="audit-row" key={rule.id}>
                    <header>
                      <strong>{rule.label}</strong>
                      <span>
                        {rule.accepted ? 'accepted' : 'not accepted'} · {words(rule.grade)} · workup
                        par {rule.workupCostPar} pts
                      </span>
                    </header>
                    <p>
                      <b>When:</b> {rule.condition}
                    </p>
                    <p>
                      <b>Required workup:</b>{' '}
                      {rule.requiredWorkups.map((item) => item.label).join(' · ') || 'none'}
                    </p>
                    {rule.conditionalRequirements.map((requirement) => (
                      <p key={`${rule.id}.${requirement.objectiveId}`}>
                        <b>{requirement.safetyCritical ? 'Safety-critical' : 'Conditional'}:</b>{' '}
                        {requirement.objectiveLabel} · met {signed(requirement.pointsIfMet)} ·
                        missing {signed(requirement.pointsIfMissing)}
                      </p>
                    ))}
                    <p>{rule.explanation}</p>
                    <ReviewLine review={rule.review} />
                    <code>{rule.id}</code>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {focused.scoreRules.length > 0 ? (
            <section className="audit-rule-group">
              <h4>Additional point and safety rules</h4>
              <div className="audit-row-list">
                {focused.scoreRules.map((rule) => (
                  <article className="audit-row" key={rule.id}>
                    <header>
                      <strong>{rule.label}</strong>
                      <span>{words(rule.component)}</span>
                    </header>
                    <dl>
                      <div>
                        <dt>If true</dt>
                        <dd>
                          {signed(rule.pointsIfTrue)} pts · {words(rule.classificationIfTrue)}
                        </dd>
                      </div>
                      <div>
                        <dt>If false</dt>
                        <dd>
                          {signed(rule.pointsIfFalse)} pts · {words(rule.classificationIfFalse)}
                        </dd>
                      </div>
                      <div>
                        <dt>Predicate</dt>
                        <dd>{rule.condition}</dd>
                      </div>
                      {rule.safetyErrorIfTrue || rule.safetyErrorIfFalse ? (
                        <div>
                          <dt>Safety error</dt>
                          <dd>{rule.safetyErrorIfTrue ?? rule.safetyErrorIfFalse}</dd>
                        </div>
                      ) : null}
                      {rule.carePointCapIfTrue !== null || rule.carePointCapIfFalse !== null ? (
                        <div>
                          <dt>Care-point cap</dt>
                          <dd>
                            {rule.carePointCapIfTrue !== null
                              ? `${rule.carePointCapIfTrue} when true`
                              : `${rule.carePointCapIfFalse} when false`}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                    <ReviewLine review={rule.review} />
                    <code>{rule.id}</code>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <details className="audit-treatment-menu">
            <summary>Complete selectable treatment menu</summary>
            <dl>
              <div>
                <dt>Start medication</dt>
                <dd>{audit.availableTreatments.startMedications.join(' · ') || 'none'}</dd>
              </div>
              <div>
                <dt>Stop medication</dt>
                <dd>{audit.availableTreatments.stopMedications.join(' · ') || 'none'}</dd>
              </div>
              <div>
                <dt>Continue medication</dt>
                <dd>{audit.availableTreatments.continueMedications.join(' · ') || 'none'}</dd>
              </div>
              <div>
                <dt>Nonmedication</dt>
                <dd>{audit.availableTreatments.interventions.join(' · ') || 'none'}</dd>
              </div>
              <div>
                <dt>Disposition</dt>
                <dd>{audit.availableTreatments.dispositions.join(' · ') || 'none'}</dd>
              </div>
            </dl>
          </details>

          <details className="audit-treatment-menu">
            <summary>Reference policies</summary>
            <ul>
              {audit.referenceSolutions.map((reference) => (
                <li key={reference.id}>
                  <strong>{reference.label}</strong> · {words(reference.kind)} ·{' '}
                  {reference.actionCount} investigations
                  <span>{reference.treatmentSummary}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </LazyDisclosure>
  );
}
