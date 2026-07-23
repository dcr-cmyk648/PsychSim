import { useEffect, useMemo, useState } from 'react';
import {
  ClinicalReviewTicketSchema,
  CompletedAttemptSchema,
  ContentFlagSchema,
  SaveDataSchema,
  type CaseBlueprint,
  type ClinicalReviewTicket,
  type CompletedAttempt,
  type ContentFlag,
  type EncounterState,
  type ProgressionMode,
  type SaveData,
} from '@psychsim/schemas';
import { approvedCaseBlueprints, catalogs, startingProfile } from '@psychsim/content-runtime';
import {
  ENGINE_VERSION,
  completeEncounter,
  consumePatientSlot,
  emptyPatientQueueState,
  ensurePatientQueues,
  refreshPatientQueue,
  rerollDeveloperSlot,
  purchaseUpgrade,
  requireCompleted,
  resetDeveloperRunHistory,
  resolveClinicForProgressionMode,
  startEncounter,
} from '@psychsim/engine';

import { ClinicHub, type PatientSlotPreview } from './components/ClinicHub';
import { EncounterView } from './components/EncounterView';
import { ReceiptView, type GuidanceDraft } from './components/ReceiptView';
import { IndexedDbSaveRepository } from './persistence';

type Screen = 'hub' | 'encounter' | 'receipt';

const developerTicketTools = import.meta.env.DEV ? import('./ticket-tools') : null;

const createInitialSave = (): SaveData =>
  SaveDataSchema.parse({
    schemaVersion: 1,
    saveDataVersion: 4,
    profile: startingProfile,
    attempts: [],
    flags: [],
    patientQueues: emptyPatientQueueState(),
    clinicalTickets: [],
    legacyArchive: [],
  });

const queueKeyFor = (mode: ProgressionMode): 'standardSlots' | 'endgameSlots' | 'developerSlots' =>
  mode === 'standard' ? 'standardSlots' : mode === 'endgame' ? 'endgameSlots' : 'developerSlots';

const withFilledQueues = (
  saveData: SaveData,
  developerBlueprints: readonly CaseBlueprint[],
  developerAuditTickets: readonly ClinicalReviewTicket[] = [],
): SaveData => {
  const normalizedMode =
    saveData.profile.progressionMode === 'developer' && !import.meta.env.DEV
      ? 'standard'
      : saveData.profile.progressionMode;
  const profile =
    normalizedMode === saveData.profile.progressionMode
      ? saveData.profile
      : { ...saveData.profile, progressionMode: normalizedMode };
  const endgameClinic = resolveClinicForProgressionMode(profile.clinic, 'endgame', catalogs);
  const existingTicketIds = new Set(saveData.clinicalTickets.map((ticket) => ticket.id));
  return SaveDataSchema.parse({
    ...saveData,
    profile,
    clinicalTickets: [
      ...saveData.clinicalTickets,
      ...developerAuditTickets.filter((ticket) => !existingTicketIds.has(ticket.id)),
    ],
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
  const repository = useMemo(() => new IndexedDbSaveRepository(), []);
  const [developerBlueprints, setDeveloperBlueprints] =
    useState<readonly CaseBlueprint[]>(approvedCaseBlueprints);
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [screen, setScreen] = useState<Screen>('hub');
  const [encounter, setEncounter] = useState<EncounterState | null>(null);
  const [attempt, setAttempt] = useState<CompletedAttempt | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [encounterMode, setEncounterMode] = useState<ProgressionMode>('standard');
  const [error, setError] = useState<string | null>(null);
  const [ticketToolStatus, setTicketToolStatus] = useState<string | null>(null);
  const [upgradeStatus, setUpgradeStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const developerContent = import.meta.env.DEV
      ? import('@psychsim/content-runtime/developer').then((module) => ({
          blueprints: module.developerCaseBlueprints,
          auditTickets: module.developerClinicalAuditTickets,
        }))
      : Promise.resolve({
          blueprints: approvedCaseBlueprints as readonly CaseBlueprint[],
          auditTickets: [] as readonly ClinicalReviewTicket[],
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
    setEncounter(startEncounter(instance, effectiveClinic, locationId));
    setAttempt(null);
    setActiveSlotId(slotId);
    setEncounterMode(saveData.profile.progressionMode);
    setError(null);
    setScreen('encounter');
    window.scrollTo({ top: 0 });
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

  const setProgressionMode = async (mode: ProgressionMode): Promise<void> => {
    if (!saveData || (mode === 'developer' && !import.meta.env.DEV)) return;
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
      setScreen('receipt');
      window.scrollTo({ top: 0 });
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
            draft.issueCategory === 'ui_or_engine_bug' ? 'technical' : 'clinical_conflict',
          priority: 'medium',
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
            'Review the patient record, applicable catalog definition, and supporting source notes before changing durable content.',
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
    const tools = await developerTicketTools;
    if (!tools) return null;
    const { buildClinicalTicketExportBundle } = tools;
    return buildClinicalTicketExportBundle({
      exportedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
      profileId: sourceSave.profile.id,
      tickets: sourceSave.clinicalTickets,
    });
  };

  const exportTickets = async (): Promise<void> => {
    if (!import.meta.env.DEV || !saveData) return;
    const bundle = await ticketBundleFor(saveData);
    if (!bundle) return;
    const tools = await developerTicketTools;
    if (!tools) return;
    const { downloadClinicalTicketBundle } = tools;
    downloadClinicalTicketBundle(bundle);
    setTicketToolStatus(`Exported ${bundle.tickets.length} ticket(s) as a versioned JSON bundle.`);
  };

  const writeTicketsToWorkspace = async (
    sourceSave: SaveData | null = saveData,
    successMessage?: string,
  ): Promise<boolean> => {
    if (!import.meta.env.DEV || !sourceSave) return false;
    const bundle = await ticketBundleFor(sourceSave);
    if (!bundle) return false;
    try {
      const tools = await developerTicketTools;
      if (!tools) return false;
      const { writeClinicalTicketBundleToWorkspace } = tools;
      const path = await writeClinicalTicketBundleToWorkspace(bundle);
      setTicketToolStatus(
        successMessage ??
          `Updated the Codex handoff file with ${bundle.tickets.length} ticket(s) at ${path}. You can now tell Codex the review is ready.`,
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

  const saveTicketReview = async (ticketId: string, reviewerNotes: string): Promise<void> => {
    if (!saveData) return;
    const ticket = saveData.clinicalTickets.find((candidate) => candidate.id === ticketId);
    if (!ticket) return;
    const normalizedNotes = reviewerNotes.trim();

    const updatedAt = new Date().toISOString();
    const notesChanged = normalizedNotes !== ticket.reviewerNotes;
    const updatedTicket = ClinicalReviewTicketSchema.parse({
      ...ticket,
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
      return;
    }
    await writeTicketsToWorkspace(
      nextSave,
      `Saved your instructions for “${ticket.title}” in browser storage and updated the Codex handoff file.`,
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

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="prototype-notice" role="note">
        Fictional · Synthetic · Medically unreviewed prototype · Not treatment guidance
      </div>
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
          developerModeAvailable={import.meta.env.DEV}
          onStart={startPatientSlot}
          onSetMode={(mode) => void setProgressionMode(mode)}
          onRefresh={() => void refreshSlots()}
          onRerollDeveloper={(slotId) => void rerollDeveloperPatient(slotId)}
          onResetDeveloper={() => void resetDeveloperPatients()}
          onSaveTicketReview={saveTicketReview}
          onWriteTickets={() => void writeTicketsToWorkspace()}
          onExportTickets={() => void exportTickets()}
          ticketToolStatus={ticketToolStatus}
          onPurchaseUpgrade={(upgradeId) => void buyUpgrade(upgradeId)}
          upgradeStatus={upgradeStatus}
        />
      ) : null}
      {screen === 'encounter' && encounter ? (
        <EncounterView
          state={encounter}
          catalogs={catalogs}
          onStateChange={setEncounter}
          onSubmit={() => void finishEncounter()}
          onExit={() => setScreen('hub')}
        />
      ) : null}
      {screen === 'receipt' && attempt ? (
        <ReceiptView
          attempt={attempt}
          developerToolsEnabled={import.meta.env.DEV}
          onBackToClinic={() => setScreen('hub')}
          onReplay={replayAttempt}
          onFlag={saveFlag}
          onSaveGuidance={saveGuidance}
        />
      ) : null}
    </>
  );
}
