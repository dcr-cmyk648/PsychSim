import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  ClinicalReviewTicketSchema,
  CompletedAttemptSchema,
  ContentFlagSchema,
  SaveDataSchema,
  type CaseBlueprint,
  type ClinicalReviewTicket,
  type CompletedAttempt,
  type ContentFlag,
  type DatabaseEntryReview,
  type EncounterState,
  type LiteratureSynthesisProposal,
  type PersonalKnowledgeWorkbenchProjection,
  type ProgressionMode,
  type SaveData,
  type SourceRequest,
  type TicketLiteratureScoutCatalog,
} from '@psychsim/schemas';
import {
  approvedCaseBlueprints,
  catalogs,
  publicClinicalCatalog,
  startingProfile,
  type CaseRuleAudit,
  type DeveloperOpinionReferenceNeed,
} from '@psychsim/content-runtime';
import { REVIEWER_ASSIGNMENT_ID } from '@psychsim/content-runtime/reviewer-assignment';
import {
  ENGINE_VERSION,
  completeEncounter,
  configureStaffAutomation,
  consumePatientSlot,
  emptyPatientQueueState,
  ensurePatientQueues,
  refreshPatientQueue,
  rerollDeveloperSlot,
  purchaseUpgrade,
  replayEncounter,
  requireCompleted,
  resetDeveloperRunHistory,
  resolveClinicForProgressionMode,
  startEncounterWithAutomaticIntake,
} from '@psychsim/engine';

import { ClinicHub, type PatientSlotPreview } from './components/ClinicHub';
import { DatabaseBrowser } from './components/DatabaseBrowser';
import { DistributionControls } from './components/DistributionControls';
import { EncounterView } from './components/EncounterView';
import { MobileWorkflowTabs, type MobileWorkflowPane } from './components/MobileWorkflowTabs';
import { ReceiptView, type GuidanceDraft } from './components/ReceiptView';
import { buildDeveloperAttemptReview } from './attempt-review';
import { buildDatabaseEntryReview } from './database-review';
import { mergeDeveloperAuditTickets } from './developer-review-state';
import { IndexedDbSaveRepository } from './persistence';
import { buildReferenceSolutionAudit } from './reference-audit';

type Screen = 'hub' | 'database' | 'encounter' | 'receipt';

const REVIEWER_BUILD = import.meta.env.VITE_PSYCHSIM_REVIEW_BUILD === '1';
const REVIEW_TOOLS_ENABLED = import.meta.env.DEV || REVIEWER_BUILD;
const reviewExportTools = REVIEW_TOOLS_ENABLED ? import('./review-export') : null;
const localTicketWriterTools =
  import.meta.env.DEV && !REVIEWER_BUILD ? import('./ticket-tools') : null;
const personalKnowledgeWorkbenchTools =
  import.meta.env.DEV && !REVIEWER_BUILD ? import('./components/PersonalKnowledgeWorkbench') : null;

const createInitialSave = (): SaveData =>
  SaveDataSchema.parse({
    schemaVersion: 1,
    saveDataVersion: 5,
    profile: REVIEWER_BUILD
      ? {
          ...startingProfile,
          progressionMode: 'developer',
        }
      : startingProfile,
    attempts: [],
    flags: [],
    patientQueues: emptyPatientQueueState(),
    clinicalTickets: [],
    attemptReviews: [],
    databaseEntryReviews: [],
    legacyArchive: [],
  });

const queueKeyFor = (mode: ProgressionMode): 'standardSlots' | 'endgameSlots' | 'developerSlots' =>
  mode === 'standard' ? 'standardSlots' : mode === 'endgame' ? 'endgameSlots' : 'developerSlots';

const withFilledQueues = (
  saveData: SaveData,
  developerBlueprints: readonly CaseBlueprint[],
  developerAuditTickets: readonly ClinicalReviewTicket[] = [],
): SaveData => {
  const normalizedMode = REVIEWER_BUILD
    ? 'developer'
    : saveData.profile.progressionMode === 'developer' && !import.meta.env.DEV
      ? 'standard'
      : saveData.profile.progressionMode;
  const profile =
    normalizedMode === saveData.profile.progressionMode
      ? saveData.profile
      : { ...saveData.profile, progressionMode: normalizedMode };
  const endgameClinic = resolveClinicForProgressionMode(profile.clinic, 'endgame', catalogs);
  return SaveDataSchema.parse({
    ...saveData,
    profile,
    clinicalTickets: mergeDeveloperAuditTickets(saveData.clinicalTickets, developerAuditTickets),
    patientQueues: ensurePatientQueues(
      saveData.patientQueues,
      profile.clinic,
      endgameClinic,
      { approved: approvedCaseBlueprints, developer: developerBlueprints },
      catalogs,
    ),
  });
};

export default function App() {
  const returnFocusId = useRef<string | null>(null);
  const repository = useMemo(
    () =>
      new IndexedDbSaveRepository(
        REVIEWER_BUILD ? `psychsim-${REVIEWER_ASSIGNMENT_ID}` : 'psychsim-local-save',
      ),
    [],
  );
  const [developerBlueprints, setDeveloperBlueprints] =
    useState<readonly CaseBlueprint[]>(approvedCaseBlueprints);
  const [developerCaseRuleAudits, setDeveloperCaseRuleAudits] = useState<readonly CaseRuleAudit[]>(
    [],
  );
  const [developerOpinionReferenceNeeds, setDeveloperOpinionReferenceNeeds] = useState<
    readonly DeveloperOpinionReferenceNeed[]
  >([]);
  const [developerSourceRequests, setDeveloperSourceRequests] = useState<readonly SourceRequest[]>(
    [],
  );
  const [developerLiteratureSynthesisProposals, setDeveloperLiteratureSynthesisProposals] =
    useState<readonly LiteratureSynthesisProposal[]>([]);
  const [developerTicketLiteratureScoutCatalog, setDeveloperTicketLiteratureScoutCatalog] =
    useState<TicketLiteratureScoutCatalog | null>(null);
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [screen, setScreen] = useState<Screen>('hub');
  const [mobileWorkflowPane, setMobileWorkflowPane] = useState<MobileWorkflowPane>('patient');
  const [encounter, setEncounter] = useState<EncounterState | null>(null);
  const [attempt, setAttempt] = useState<CompletedAttempt | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [encounterMode, setEncounterMode] = useState<ProgressionMode>('standard');
  const [error, setError] = useState<string | null>(null);
  const [ticketToolStatus, setTicketToolStatus] = useState<string | null>(null);
  const [upgradeStatus, setUpgradeStatus] = useState<string | null>(null);
  const [personalKnowledgeWorkbench, setPersonalKnowledgeWorkbench] = useState<{
    Component: ComponentType<{ projection: PersonalKnowledgeWorkbenchProjection | null }>;
    projection: PersonalKnowledgeWorkbenchProjection | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    if (!personalKnowledgeWorkbenchTools) return;
    void personalKnowledgeWorkbenchTools.then(async (module) => {
      const projection = await module.loadPersonalKnowledgeWorkbench();
      if (active) {
        setPersonalKnowledgeWorkbench({
          Component: module.PersonalKnowledgeWorkbench,
          projection,
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const developerContent = REVIEWER_BUILD
      ? import('@psychsim/content-runtime/reviewer').then((module) => ({
          blueprints: [
            ...approvedCaseBlueprints,
            ...module.reviewerCaseBlueprints,
          ] as readonly CaseBlueprint[],
          auditTickets: module.reviewerClinicalAuditTickets,
          caseRuleAudits: module.reviewerCaseRuleAudits,
          opinionReferenceNeeds: [] as readonly DeveloperOpinionReferenceNeed[],
          sourceRequests: [] as readonly SourceRequest[],
          literatureSynthesisProposals: [] as readonly LiteratureSynthesisProposal[],
          ticketLiteratureScoutCatalog: null as TicketLiteratureScoutCatalog | null,
        }))
      : import.meta.env.DEV
        ? import('@psychsim/content-runtime/developer').then((module) => ({
            blueprints: module.developerCaseBlueprints,
            auditTickets: module.developerClinicalAuditTickets,
            caseRuleAudits: module.developerCaseRuleAudits,
            opinionReferenceNeeds: module.developerOpinionReferenceNeeds,
            sourceRequests: module.developerSourceRequests,
            literatureSynthesisProposals: module.developerLiteratureSynthesisProposals,
            ticketLiteratureScoutCatalog: module.developerTicketLiteratureScoutCatalog,
          }))
        : Promise.resolve({
            blueprints: approvedCaseBlueprints as readonly CaseBlueprint[],
            auditTickets: [] as readonly ClinicalReviewTicket[],
            caseRuleAudits: [] as readonly CaseRuleAudit[],
            opinionReferenceNeeds: [] as readonly DeveloperOpinionReferenceNeed[],
            sourceRequests: [] as readonly SourceRequest[],
            literatureSynthesisProposals: [] as readonly LiteratureSynthesisProposal[],
            ticketLiteratureScoutCatalog: null as TicketLiteratureScoutCatalog | null,
          });
    void Promise.all([repository.load(), developerContent])
      .then(async ([saved, developerData]) => {
        if (!active) return;
        const hydrated = withFilledQueues(
          saved ?? createInitialSave(),
          developerData.blueprints,
          developerData.auditTickets,
        );
        await repository.save(hydrated);
        if (!active) return;
        setDeveloperBlueprints(developerData.blueprints);
        setDeveloperCaseRuleAudits(developerData.caseRuleAudits);
        setDeveloperOpinionReferenceNeeds(developerData.opinionReferenceNeeds);
        setDeveloperSourceRequests(developerData.sourceRequests);
        setDeveloperLiteratureSynthesisProposals(developerData.literatureSynthesisProposals);
        setDeveloperTicketLiteratureScoutCatalog(developerData.ticketLiteratureScoutCatalog);
        setSaveData(hydrated);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : 'Local save data could not be loaded.',
          );
          setSaveData(withFilledQueues(createInitialSave(), approvedCaseBlueprints));
        }
      });
    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const mobileReceiptHeading =
        screen === 'receipt' && window.matchMedia('(max-width: 760px)').matches
          ? document.getElementById('score-comparison-title')
          : null;
      if (mobileReceiptHeading) {
        mobileReceiptHeading.scrollIntoView({ block: 'center', behavior: 'instant' });
        mobileReceiptHeading.focus({ preventScroll: true });
        return;
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const destinationHeadingId =
        screen === 'encounter'
          ? 'patient-chart-title'
          : screen === 'receipt'
            ? 'receipt-title'
            : screen === 'database'
              ? 'database-title'
              : screen === 'hub'
                ? returnFocusId.current
                : null;
      if (destinationHeadingId) {
        document.getElementById(destinationHeadingId)?.focus({ preventScroll: true });
        if (screen === 'hub') returnFocusId.current = null;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [screen]);

  const effectiveClinic = useMemo(
    () =>
      saveData
        ? resolveClinicForProgressionMode(
            saveData.profile.clinic,
            saveData.profile.progressionMode,
            catalogs,
          )
        : null,
    [saveData],
  );
  const referenceSolutionAudit = useMemo(
    () => (attempt ? buildReferenceSolutionAudit(attempt, catalogs) : null),
    [attempt],
  );

  const patientSlots = useMemo<PatientSlotPreview[]>(() => {
    if (!saveData) return [];
    return saveData.patientQueues[queueKeyFor(saveData.profile.progressionMode)].map((slot) => ({
      id: slot.id,
      casePreview: slot.caseInstance,
      settingLabel:
        catalogs.locations.find((location) => location.id === slot.locationId)?.label ??
        slot.locationId,
      locationId: slot.locationId,
    }));
  }, [saveData]);

  const persist = async (nextSave: SaveData): Promise<void> => {
    await repository.save(nextSave);
    setSaveData(nextSave);
  };

  const openEncounter = (
    instance: PatientSlotPreview['casePreview'],
    locationId: string,
    slotId: string | null,
  ): void => {
    if (!effectiveClinic || !saveData) return;
    const started = startEncounterWithAutomaticIntake(
      instance,
      effectiveClinic,
      locationId,
      catalogs,
    );
    if (!started.ok) {
      setError(started.error.message);
      return;
    }
    setEncounter(started.value);
    setAttempt(null);
    setActiveSlotId(slotId);
    setEncounterMode(saveData.profile.progressionMode);
    setMobileWorkflowPane('patient');
    setError(null);
    setScreen('encounter');
  };

  const startPatientSlot = (slotId: string): void => {
    const slot = patientSlots.find((candidate) => candidate.id === slotId);
    if (slot) openEncounter(slot.casePreview, slot.locationId, slot.id);
  };

  const replayAttempt = (): void => {
    if (!attempt || !effectiveClinic) return;
    const locationId = effectiveClinic.locationIds.find((candidate) =>
      attempt.caseInstance.metadata.compatibleLocationIds.includes(candidate),
    );
    if (!locationId) {
      setError('This historical patient is not available in the current setting.');
      return;
    }
    openEncounter(attempt.caseInstance, locationId, null);
  };

  const openSavedAttemptForReview = (attemptId: string): void => {
    if (!saveData || !REVIEW_TOOLS_ENABLED) return;
    const savedAttempt = saveData.attempts.find((candidate) => candidate.id === attemptId);
    if (!savedAttempt) {
      setError('That saved case receipt is no longer available.');
      return;
    }
    const replay = replayEncounter(
      savedAttempt.caseInstance,
      savedAttempt.clinicStateAtStart,
      savedAttempt.events,
      catalogs,
    );
    if (!replay.ok || replay.value.status !== 'submitted') {
      setError(
        replay.ok
          ? 'That saved case did not replay to a submitted receipt.'
          : `That saved case could not be reopened: ${replay.error.message}`,
      );
      return;
    }
    setEncounter(replay.value);
    setAttempt(savedAttempt);
    setActiveSlotId(null);
    setEncounterMode('developer');
    setMobileWorkflowPane('results');
    setError(null);
    setScreen('receipt');
  };

  const setProgressionMode = async (mode: ProgressionMode): Promise<void> => {
    if (
      !saveData ||
      (mode === 'developer' && !REVIEW_TOOLS_ENABLED) ||
      (REVIEWER_BUILD && mode !== 'developer')
    ) {
      return;
    }
    const nextSave = withFilledQueues(
      SaveDataSchema.parse({
        ...saveData,
        profile: { ...saveData.profile, progressionMode: mode },
      }),
      developerBlueprints,
    );
    await persist(nextSave);
    setError(null);
  };

  const refreshSlots = async (): Promise<void> => {
    if (!saveData || saveData.profile.progressionMode === 'standard') return;
    const endgameClinic = resolveClinicForProgressionMode(
      saveData.profile.clinic,
      'endgame',
      catalogs,
    );
    const patientQueues = refreshPatientQueue(
      saveData.patientQueues,
      saveData.profile.progressionMode,
      saveData.profile.clinic,
      endgameClinic,
      { approved: approvedCaseBlueprints, developer: developerBlueprints },
      catalogs,
    );
    await persist(SaveDataSchema.parse({ ...saveData, patientQueues }));
  };

  const rerollDeveloperPatient = async (slotId: string): Promise<void> => {
    if (!saveData || saveData.profile.progressionMode !== 'developer') return;
    const endgameClinic = resolveClinicForProgressionMode(
      saveData.profile.clinic,
      'endgame',
      catalogs,
    );
    const patientQueues = rerollDeveloperSlot(
      saveData.patientQueues,
      slotId,
      endgameClinic,
      developerBlueprints,
      catalogs,
    );
    await persist(SaveDataSchema.parse({ ...saveData, patientQueues }));
  };

  const resetDeveloperPatients = async (): Promise<void> => {
    if (!saveData || saveData.profile.progressionMode !== 'developer') return;
    const patientQueues = resetDeveloperRunHistory(saveData.patientQueues);
    await persist(
      withFilledQueues(SaveDataSchema.parse({ ...saveData, patientQueues }), developerBlueprints),
    );
  };

  const buyUpgrade = async (upgradeId: string): Promise<void> => {
    if (!saveData || saveData.profile.progressionMode !== 'standard') return;
    const result = purchaseUpgrade(saveData.profile.clinic, upgradeId, catalogs);
    if (!result.ok) {
      setUpgradeStatus(result.error.message);
      return;
    }
    const upgrade = catalogs.upgrades.find((candidate) => candidate.id === upgradeId);
    const nextSave = withFilledQueues(
      SaveDataSchema.parse({
        ...saveData,
        profile: { ...saveData.profile, clinic: result.value },
      }),
      developerBlueprints,
    );
    await persist(nextSave);
    setUpgradeStatus(
      `${upgrade?.label ?? 'Upgrade'} purchased. ${result.value.clinicPoints.toLocaleString()} points remain.`,
    );
  };

  const updateStaffAutomation = async (
    staffUpgradeId: string,
    actionIds: readonly string[],
  ): Promise<void> => {
    if (!saveData || saveData.profile.progressionMode !== 'standard') return;
    const result = configureStaffAutomation(
      saveData.profile.clinic,
      staffUpgradeId,
      actionIds,
      catalogs,
    );
    if (!result.ok) {
      setUpgradeStatus(result.error.message);
      return;
    }
    const nextSave = withFilledQueues(
      SaveDataSchema.parse({
        ...saveData,
        profile: { ...saveData.profile, clinic: result.value },
      }),
      developerBlueprints,
    );
    await persist(nextSave);
    setUpgradeStatus('Automatic intake choices saved. They apply to the next patient opened.');
  };

  const finishEncounter = async (): Promise<void> => {
    if (!saveData || !encounter) return;
    try {
      const completed = requireCompleted(completeEncounter(encounter, catalogs));
      const attemptNumber = saveData.attempts.length + 1;
      const attemptId = `attempt.${completed.state.caseInstance.blueprintId}.${attemptNumber}`;
      const completedAttempt = CompletedAttemptSchema.parse({
        schemaVersion: 1,
        id: attemptId,
        caseId: completed.state.caseInstance.blueprintId,
        blueprintId: completed.state.caseInstance.blueprintId,
        caseContentVersion: completed.state.caseInstance.contentVersion,
        seed: completed.state.caseInstance.seed,
        caseInstance: completed.state.caseInstance,
        clinicStateAtStart: completed.state.clinicState,
        events: completed.state.events,
        purchases: completed.state.purchases,
        submittedTreatment: completed.state.selections,
        receipt: completed.receipt,
        completedAt: new Date().toISOString(),
      });
      const settlement = completed.receipt.settlement;
      const updatedClinic = {
        ...saveData.profile.clinic,
        clinicPoints: settlement.persistentPointsAfter,
        lifetimePointsEarned: settlement.lifetimePointsAfter,
      };
      const endgameClinic = resolveClinicForProgressionMode(updatedClinic, 'endgame', catalogs);
      const patientQueues = activeSlotId
        ? consumePatientSlot(
            saveData.patientQueues,
            activeSlotId,
            encounterMode,
            updatedClinic,
            endgameClinic,
            { approved: approvedCaseBlueprints, developer: developerBlueprints },
            catalogs,
          )
        : saveData.patientQueues;
      const nextSave = SaveDataSchema.parse({
        ...saveData,
        profile: {
          ...saveData.profile,
          clinic: updatedClinic,
          completedAttemptIds: [...saveData.profile.completedAttemptIds, attemptId],
        },
        patientQueues,
        attempts: [...saveData.attempts, completedAttempt],
      });
      await persist(nextSave);
      setEncounter(completed.state);
      setAttempt(completedAttempt);
      setActiveSlotId(null);
      setMobileWorkflowPane('results');
      setScreen('receipt');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The encounter could not be settled.');
    }
  };

  const saveFlag = async (draft: {
    disputedItemId: string | null;
    issueCategory: ContentFlag['issueCategory'];
    requiresClinicalReview: boolean;
    note: string;
  }): Promise<void> => {
    if (!saveData || !attempt) return;
    const createdAt = new Date().toISOString();
    const flag = ContentFlagSchema.parse({
      schemaVersion: 1,
      id: `flag.${attempt.blueprintId}.${saveData.flags.length + 1}`,
      caseId: attempt.caseId,
      blueprintId: attempt.blueprintId,
      caseContentVersion: attempt.caseContentVersion,
      generatedSeed: attempt.seed,
      engineVersion: ENGINE_VERSION,
      attemptId: attempt.id,
      eventHistory: attempt.events,
      treatmentSelections: attempt.submittedTreatment,
      pointReport: attempt.receipt.pointReport,
      disputedItemId: draft.disputedItemId,
      issueCategory: draft.issueCategory,
      requiresClinicalReview: draft.requiresClinicalReview,
      note: draft.note,
      reviewStatus: 'open',
      createdAt,
    });
    const ticket = draft.requiresClinicalReview
      ? ClinicalReviewTicketSchema.parse({
          schemaVersion: 1,
          id: `ticket.${attempt.blueprintId}.${saveData.clinicalTickets.length + 1}`,
          title: `Review flagged ${draft.issueCategory.replaceAll('_', ' ')}`,
          sourceKind: 'content_flag',
          sourceAuthority: 'developer_observation',
          ticketType:
            draft.issueCategory === 'ui_or_engine_bug'
              ? 'technical'
              : draft.issueCategory === 'needs_additional_source'
                ? 'source_gap'
                : 'clinical_conflict',
          priority: draft.issueCategory === 'needs_additional_source' ? 'high' : 'medium',
          status: 'proposed',
          requiresClinicalAcumen: true,
          attemptId: attempt.id,
          blueprintId: attempt.blueprintId,
          caseContentVersion: attempt.caseContentVersion,
          receiptItemId: draft.disputedItemId,
          receiptItemSnapshot:
            attempt.receipt.items.find((item) => item.id === draft.disputedItemId) ?? null,
          targetContentIds: [attempt.blueprintId],
          dependencyTicketIds: [],
          conflictContentIds: [],
          proposedRouting:
            draft.issueCategory === 'needs_additional_source'
              ? 'Identify the exact unresolved clinical question and affected rule, check existing evidence first, then create or update a tracked source request. Do not infer the missing guidance.'
              : 'Review the patient record, applicable catalog definition, and supporting source notes before changing durable content.',
          guidance: draft.note || 'Clinical review requested from the local case receipt.',
          resurfacingTrigger: null,
          resolution: null,
          createdAt,
          updatedAt: createdAt,
        })
      : null;
    const nextSave = SaveDataSchema.parse({
      ...saveData,
      flags: [...saveData.flags, flag],
      clinicalTickets: ticket ? [...saveData.clinicalTickets, ticket] : saveData.clinicalTickets,
    });
    await persist(nextSave);
  };

  const saveGuidance = async (draft: GuidanceDraft): Promise<void> => {
    if (!saveData || !attempt) return;
    const item = attempt.receipt.items.find((candidate) => candidate.id === draft.receiptItemId);
    if (!item) return;
    const createdAt = new Date().toISOString();
    const ticket = ClinicalReviewTicketSchema.parse({
      schemaVersion: 1,
      id: `ticket.${attempt.blueprintId}.${saveData.clinicalTickets.length + 1}`,
      title: `Receipt guidance: ${item.itemName}`,
      sourceKind: 'receipt_guidance',
      sourceAuthority: 'developer_observation',
      ticketType: draft.ticketType,
      priority: draft.requiresClinicalAcumen ? 'high' : 'medium',
      status: 'proposed',
      requiresClinicalAcumen: draft.requiresClinicalAcumen,
      attemptId: attempt.id,
      blueprintId: attempt.blueprintId,
      caseContentVersion: attempt.caseContentVersion,
      receiptItemId: item.id,
      receiptItemSnapshot: item,
      targetContentIds: [attempt.blueprintId],
      dependencyTicketIds: [],
      conflictContentIds: [],
      proposedRouting:
        'Treat this as a proposed change. Audit the patient-owned facts, relevant test or medication file, and source notes before implementation.',
      guidance: draft.guidance,
      resurfacingTrigger: draft.resurfacingTrigger || null,
      resolution: null,
      createdAt,
      updatedAt: createdAt,
    });
    await persist(
      SaveDataSchema.parse({
        ...saveData,
        clinicalTickets: [...saveData.clinicalTickets, ticket],
      }),
    );
  };

  const ticketBundleFor = async (sourceSave: SaveData) => {
    const tools = await reviewExportTools;
    if (!tools) return null;
    const { buildClinicalTicketExportBundle } = tools;
    return buildClinicalTicketExportBundle({
      exportedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
      profileId: sourceSave.profile.id,
      buildKind: REVIEWER_BUILD ? 'portable_reviewer' : 'local_developer',
      assignmentId: REVIEWER_BUILD ? REVIEWER_ASSIGNMENT_ID : null,
      tickets: sourceSave.clinicalTickets,
      attemptReviews: sourceSave.attemptReviews,
      databaseEntryReviews: sourceSave.databaseEntryReviews,
      flags: sourceSave.flags,
      completedAttempts: sourceSave.attempts,
    });
  };

  const exportTickets = async (): Promise<void> => {
    if (!REVIEW_TOOLS_ENABLED || !saveData) return;
    const bundle = await ticketBundleFor(saveData);
    if (!bundle) return;
    const tools = await reviewExportTools;
    if (!tools) return;
    const { downloadClinicalTicketBundle } = tools;
    downloadClinicalTicketBundle(bundle);
    setTicketToolStatus(
      `Download started for one versioned JSON bundle with ${bundle.completedAttempts.length} completed case(s), ${bundle.attemptReviews.length} case review(s), ${bundle.databaseEntryReviews.length} database comment(s), ${bundle.flags.length} flag(s), and ${bundle.tickets.length} ticket(s). Confirm that the file appears in your browser's downloads before clearing this device.`,
    );
  };

  const writeTicketsToWorkspace = async (
    sourceSave: SaveData | null = saveData,
    successMessage?: string,
  ): Promise<boolean> => {
    if (REVIEWER_BUILD || !import.meta.env.DEV || !sourceSave) return false;
    const bundle = await ticketBundleFor(sourceSave);
    if (!bundle) return false;
    try {
      const tools = await localTicketWriterTools;
      if (!tools) return false;
      const { writeClinicalTicketBundleToWorkspace } = tools;
      const path = await writeClinicalTicketBundleToWorkspace(bundle);
      setTicketToolStatus(
        successMessage ??
          `Updated the Codex handoff file with ${bundle.tickets.length} ticket(s), ${bundle.attemptReviews.length} attempt review(s), and ${bundle.databaseEntryReviews.length} database comment(s) at ${path}. You can now tell Codex the review is ready.`,
      );
      return true;
    } catch (caught) {
      setTicketToolStatus(
        `Your browser review data remains saved, but the Codex handoff file could not be updated: ${
          caught instanceof Error ? caught.message : 'unknown local writer error'
        }`,
      );
      return false;
    }
  };

  const saveTicketReview = async (
    ticketId: string,
    reviewerNotes: string,
    linkedAttemptId?: string,
  ): Promise<void> => {
    if (!saveData) return;
    const ticket = saveData.clinicalTickets.find((candidate) => candidate.id === ticketId);
    if (!ticket) return;
    const normalizedNotes = reviewerNotes.trim();

    const updatedAt = new Date().toISOString();
    const notesChanged = normalizedNotes !== ticket.reviewerNotes;
    const updatedTicket = ClinicalReviewTicketSchema.parse({
      ...ticket,
      attemptId: linkedAttemptId ?? ticket.attemptId,
      status: normalizedNotes ? 'in_review' : 'proposed',
      reviewerNotes: normalizedNotes,
      reviewerNotesUpdatedAt: notesChanged
        ? normalizedNotes
          ? updatedAt
          : null
        : ticket.reviewerNotesUpdatedAt,
      updatedAt,
      resolution: null,
    });
    const clinicalTickets = saveData.clinicalTickets.map((candidate) =>
      candidate.id === ticketId ? updatedTicket : candidate,
    );
    const nextSave = SaveDataSchema.parse({ ...saveData, clinicalTickets });
    try {
      await persist(nextSave);
    } catch (caught) {
      setTicketToolStatus(
        caught instanceof Error
          ? `The review could not be saved in browser storage: ${caught.message}`
          : 'The review could not be saved in browser storage.',
      );
      throw caught;
    }
    if (REVIEWER_BUILD) {
      setTicketToolStatus(`Saved your response for “${ticket.title}” in this browser.`);
      return;
    }
    await writeTicketsToWorkspace(
      nextSave,
      `Saved your instructions for “${ticket.title}” in browser storage and updated the Codex handoff file.`,
    );
  };

  const saveDeveloperAttemptReview = async (reviewerNote: string): Promise<boolean> => {
    if (!REVIEW_TOOLS_ENABLED || encounterMode !== 'developer' || !saveData || !attempt) {
      return false;
    }
    const existingReview = saveData.attemptReviews.find(
      (candidate) => candidate.attemptId === attempt.id,
    );
    const review = buildDeveloperAttemptReview({
      attempt,
      catalogs,
      engineVersion: ENGINE_VERSION,
      reviewerNote,
      timestamp: new Date().toISOString(),
      existingReview,
    });
    const attemptReviews = existingReview
      ? saveData.attemptReviews.map((candidate) =>
          candidate.attemptId === attempt.id ? review : candidate,
        )
      : [...saveData.attemptReviews, review];
    const nextSave = SaveDataSchema.parse({ ...saveData, attemptReviews });
    await persist(nextSave);
    if (REVIEWER_BUILD) {
      setTicketToolStatus(
        `Saved this case review in this browser. ${attemptReviews.length} case review(s) are ready for one JSON export.`,
      );
      return true;
    }
    return writeTicketsToWorkspace(
      nextSave,
      `Saved your review of ${attempt.caseInstance.opening.title} with the exact attempt snapshot and updated the Codex handoff file.`,
    );
  };

  const saveDatabaseEntryReview = async (
    entry: Parameters<typeof buildDatabaseEntryReview>[0]['entry'],
    reviewerNote: string,
  ): Promise<boolean> => {
    if (!REVIEW_TOOLS_ENABLED || !saveData) return false;
    const existingReview = saveData.databaseEntryReviews.find(
      (candidate) => candidate.entryId === entry.id,
    );
    const normalizedNote = reviewerNote.trim();
    const databaseEntryReviews: DatabaseEntryReview[] = normalizedNote
      ? [
          ...saveData.databaseEntryReviews.filter((candidate) => candidate.entryId !== entry.id),
          buildDatabaseEntryReview({
            entry,
            projection: publicClinicalCatalog,
            reviewerNote: normalizedNote,
            timestamp: new Date().toISOString(),
            ...(existingReview ? { existingReview } : {}),
          }),
        ]
      : saveData.databaseEntryReviews.filter((candidate) => candidate.entryId !== entry.id);
    const nextSave = SaveDataSchema.parse({ ...saveData, databaseEntryReviews });
    await persist(nextSave);
    if (REVIEWER_BUILD) {
      setTicketToolStatus(
        normalizedNote
          ? `Saved your comment on “${entry.label}” in this browser.`
          : `Removed the saved comment on “${entry.label}”.`,
      );
      return true;
    }
    return writeTicketsToWorkspace(
      nextSave,
      normalizedNote
        ? `Saved your comment on “${entry.label}” in browser storage and updated the Codex handoff file.`
        : `Removed the comment on “${entry.label}” and updated the Codex handoff file.`,
    );
  };

  if (!saveData) {
    return (
      <main className="loading-screen" aria-live="polite">
        <div className="loading-mark" aria-hidden="true">
          Ψ
        </div>
        <p>Opening the clinic…</p>
      </main>
    );
  }

  const PersonalKnowledgeWorkbenchComponent = personalKnowledgeWorkbench?.Component ?? null;
  const personalKnowledgeProjection = personalKnowledgeWorkbench?.projection ?? null;

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="prototype-notice" role="note">
        Fictional · Synthetic · Medically unreviewed prototype · Not treatment guidance
      </div>
      <DistributionControls
        safeToReload={screen === 'hub' || screen === 'database'}
        showInstallControl={screen === 'hub'}
      />
      {error ? (
        <div className="global-error" role="alert">
          {error}
        </div>
      ) : null}
      {screen === 'hub' ? (
        <ClinicHub
          saveData={saveData}
          clinicState={effectiveClinic ?? saveData.profile.clinic}
          catalogs={catalogs}
          patientSlots={patientSlots}
          developerModeAvailable={REVIEW_TOOLS_ENABLED}
          reviewerBuild={REVIEWER_BUILD}
          caseRuleAudits={developerCaseRuleAudits}
          opinionReferenceNeeds={developerOpinionReferenceNeeds}
          sourceRequests={developerSourceRequests}
          literatureSynthesisProposals={developerLiteratureSynthesisProposals}
          ticketLiteratureScoutCatalog={developerTicketLiteratureScoutCatalog}
          developerKnowledgeWorkbench={
            PersonalKnowledgeWorkbenchComponent ? (
              <PersonalKnowledgeWorkbenchComponent projection={personalKnowledgeProjection} />
            ) : null
          }
          onStart={startPatientSlot}
          onOpenDatabase={() => {
            returnFocusId.current = 'database-launch-button';
            setScreen('database');
          }}
          onOpenSavedAttempt={openSavedAttemptForReview}
          onSetMode={(mode) => void setProgressionMode(mode)}
          onRefresh={() => void refreshSlots()}
          onRerollDeveloper={(slotId) => void rerollDeveloperPatient(slotId)}
          onResetDeveloper={() => void resetDeveloperPatients()}
          onSaveTicketReview={saveTicketReview}
          onWriteTickets={() => void writeTicketsToWorkspace()}
          onExportTickets={() => void exportTickets()}
          ticketToolStatus={ticketToolStatus}
          onPurchaseUpgrade={(upgradeId) => void buyUpgrade(upgradeId)}
          onConfigureStaffAutomation={(staffUpgradeId, actionIds) =>
            void updateStaffAutomation(staffUpgradeId, actionIds)
          }
          upgradeStatus={upgradeStatus}
        />
      ) : null}
      {screen === 'database' ? (
        <DatabaseBrowser
          projection={publicClinicalCatalog}
          reviews={saveData.databaseEntryReviews}
          reviewToolsEnabled={REVIEW_TOOLS_ENABLED}
          reviewStatusMessage={ticketToolStatus}
          exportAvailable={
            saveData.databaseEntryReviews.length > 0 ||
            saveData.attemptReviews.length > 0 ||
            saveData.flags.length > 0 ||
            saveData.clinicalTickets.some((ticket) => ticket.reviewerNotes.trim())
          }
          onSaveReview={saveDatabaseEntryReview}
          onExportReviews={() => void exportTickets()}
          onBack={() => setScreen('hub')}
        />
      ) : null}
      {(screen === 'encounter' || screen === 'receipt') && encounter ? (
        <div
          id="main-content"
          className={`case-workflow phase-${screen} active-${mobileWorkflowPane}`}
          data-testid="case-workflow"
        >
          <MobileWorkflowTabs
            activePane={mobileWorkflowPane}
            includeResults={screen === 'receipt'}
            onChange={setMobileWorkflowPane}
          />
          {screen === 'encounter' ? (
            <EncounterView
              state={encounter}
              catalogs={catalogs}
              onStateChange={setEncounter}
              onSubmit={() => void finishEncounter()}
              onExit={() => setScreen('hub')}
              mobileActivePane={mobileWorkflowPane}
              onMobilePaneChange={setMobileWorkflowPane}
            />
          ) : null}
          {screen === 'receipt' && attempt ? (
            <>
              <div className="receipt-review-context">
                <EncounterView
                  state={encounter}
                  catalogs={catalogs}
                  onStateChange={setEncounter}
                  onSubmit={() => undefined}
                  onExit={() => setScreen('hub')}
                  mobileActivePane={mobileWorkflowPane}
                  onMobilePaneChange={setMobileWorkflowPane}
                  readOnly
                />
              </div>
              <div
                id="mobile-panel-results"
                className="receipt-results-context"
                role="tabpanel"
                aria-labelledby="mobile-tab-results"
              >
                <ReceiptView
                  attempt={attempt}
                  developerToolsEnabled={REVIEW_TOOLS_ENABLED}
                  developerCaseReviewEnabled={REVIEW_TOOLS_ENABLED && encounterMode === 'developer'}
                  portableReviewerBuild={REVIEWER_BUILD}
                  referenceSolutionAudit={referenceSolutionAudit}
                  initialDeveloperReviewNote={
                    saveData.attemptReviews.find((review) => review.attemptId === attempt.id)
                      ?.reviewerNote ?? ''
                  }
                  linkedReviewTickets={saveData.clinicalTickets.filter(
                    (ticket) =>
                      ticket.status !== 'resolved' &&
                      ticket.blueprintId === attempt.caseInstance.blueprintId,
                  )}
                  onBackToClinic={() => setScreen('hub')}
                  onReplay={replayAttempt}
                  onExportReviews={() => void exportTickets()}
                  reviewExportAvailable={
                    saveData.attemptReviews.length > 0 ||
                    saveData.flags.length > 0 ||
                    saveData.clinicalTickets.length > 0
                  }
                  onFlag={saveFlag}
                  onSaveGuidance={saveGuidance}
                  onSaveDeveloperReview={saveDeveloperAttemptReview}
                  onSaveLinkedTicketReview={(ticketId, reviewerNotes) =>
                    saveTicketReview(ticketId, reviewerNotes, attempt.id)
                  }
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
