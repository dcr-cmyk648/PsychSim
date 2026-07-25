// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildCaseRuleAudit,
  catalogs,
  prototypeCaseBlueprint,
  startingProfile,
} from '@psychsim/content-runtime';
import {
  developerCaseBlueprints,
  developerClinicalAuditTickets,
  developerOpinionReferenceNeeds,
  developerSourceRequests,
  developerTicketLiteratureScoutCatalog,
} from '@psychsim/content-runtime/developer';
import { emptyPatientQueueState, instantiateCase } from '@psychsim/engine';
import { ClinicalReviewTicketSchema, SaveDataSchema } from '@psychsim/schemas';

import { ClinicHub } from './ClinicHub';

afterEach(cleanup);

describe('ClinicHub', () => {
  it('renders the persisted profile and a neutral accessible patient launch control', () => {
    const onStart = vi.fn();
    const onOpenDatabase = vi.fn();
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 5,
      profile: startingProfile,
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [],
      attemptReviews: [],
      legacyArchive: [],
    });
    const casePreview = instantiateCase(prototypeCaseBlueprint, 'prototype-1', catalogs);
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={saveData.profile.clinic}
        catalogs={catalogs}
        patientSlots={[
          {
            id: 'patient-slot-1',
            casePreview,
            settingLabel: 'Solo Office · Outpatient Room',
            locationId: 'location.solo-office.outpatient',
          },
        ]}
        developerModeAvailable
        caseRuleAudits={[]}
        opinionReferenceNeeds={[]}
        sourceRequests={[]}
        onStart={onStart}
        onOpenDatabase={onOpenDatabase}
        onSetMode={vi.fn()}
        onRefresh={vi.fn()}
        onRerollDeveloper={vi.fn()}
        onResetDeveloper={vi.fn()}
        onSaveTicketReview={vi.fn()}
        onWriteTickets={vi.fn()}
        onExportTickets={vi.fn()}
        ticketToolStatus={null}
        onPurchaseUpgrade={vi.fn()}
        upgradeStatus={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Lakeshore Psychiatric Office' })).toBeVisible();
    expect(screen.getByRole('heading', { name: casePreview.opening.title })).toBeVisible();
    expect(screen.queryByText(/depression case|straightforward/i)).not.toBeInTheDocument();
    expect(screen.getByText('Solo Office · Outpatient Room')).toBeVisible();
    expect(screen.queryByText(/seed/i)).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Database' }).click();
    expect(onOpenDatabase).toHaveBeenCalledOnce();
    screen.getByRole('button', { name: `Open chart for ${casePreview.opening.title}` }).click();
    expect(onStart).toHaveBeenCalledWith('patient-slot-1');
  });

  it('shows data-driven upgrade economics and emits a purchase request', () => {
    const onPurchaseUpgrade = vi.fn();
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 5,
      profile: {
        ...startingProfile,
        clinic: { ...startingProfile.clinic, clinicPoints: 1_500 },
      },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [],
      attemptReviews: [],
      legacyArchive: [],
    });
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={saveData.profile.clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable
        caseRuleAudits={[]}
        opinionReferenceNeeds={[]}
        sourceRequests={[]}
        onStart={vi.fn()}
        onSetMode={vi.fn()}
        onRefresh={vi.fn()}
        onRerollDeveloper={vi.fn()}
        onResetDeveloper={vi.fn()}
        onSaveTicketReview={vi.fn()}
        onWriteTickets={vi.fn()}
        onExportTickets={vi.fn()}
        ticketToolStatus={null}
        onPurchaseUpgrade={onPurchaseUpgrade}
        upgradeStatus={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Compact 12-lead ECG' })).toBeVisible();
    expect(screen.getByText(/Outside medical clinic · 500 pts/)).toBeVisible();
    expect(screen.getByText(/In-house ECG machine · 70 pts/)).toBeVisible();
    expect(screen.getByText('430 pts')).toBeVisible();
    expect(screen.getByText('About 3 uses')).toBeVisible();
    screen.getByRole('button', { name: 'Buy for 1,200 pts' }).click();
    expect(onPurchaseUpgrade).toHaveBeenCalledWith('upgrade.equipment.ecg');
  });

  it('lets an owned intake assistant configure a bounded automatic routine', () => {
    const onConfigureStaffAutomation = vi.fn();
    const clinic = {
      ...startingProfile.clinic,
      clinicPoints: 1_000,
      lifetimePointsEarned: 1_000,
      ownedUpgradeIds: ['upgrade.staff.intake-assistant'],
      staffConfigurations: [
        {
          staffUpgradeId: 'upgrade.staff.intake-assistant',
          automaticInformationActionIds: ['info.history.medication-reconciliation'],
        },
      ],
    };
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 5,
      profile: { ...startingProfile, clinic },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [],
      attemptReviews: [],
      legacyArchive: [],
    });
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable
        caseRuleAudits={[]}
        opinionReferenceNeeds={[]}
        sourceRequests={[]}
        onStart={vi.fn()}
        onSetMode={vi.fn()}
        onRefresh={vi.fn()}
        onRerollDeveloper={vi.fn()}
        onResetDeveloper={vi.fn()}
        onSaveTicketReview={vi.fn()}
        onWriteTickets={vi.fn()}
        onExportTickets={vi.fn()}
        ticketToolStatus={null}
        onPurchaseUpgrade={vi.fn()}
        onConfigureStaffAutomation={onConfigureStaffAutomation}
        upgradeStatus={null}
      />,
    );

    expect(screen.getByRole('group', { name: 'Automatic routine intake' })).toBeVisible();
    expect(screen.getByText('30 → 18 pts per patient')).toBeVisible();
    fireEvent.click(screen.getByRole('checkbox', { name: /Depressive symptoms/ }));
    expect(onConfigureStaffAutomation).toHaveBeenCalledWith('upgrade.staff.intake-assistant', [
      'info.history.medication-reconciliation',
      'info.history.depressive-symptoms',
    ]);
  });

  it('shows threshold-gated facility moves and visible purchased decor', () => {
    const onPurchaseUpgrade = vi.fn();
    const clinic = {
      ...startingProfile.clinic,
      clinicPoints: 5_000,
      lifetimePointsEarned: 2_500,
      ownedUpgradeIds: ['decor.plant.pothos'],
      satisfaction: 6,
      satisfactionMultiplier: 1.035,
    };
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 5,
      profile: { ...startingProfile, clinic },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [],
      attemptReviews: [],
      legacyArchive: [],
    });
    const { container } = render(
      <ClinicHub
        saveData={saveData}
        clinicState={clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable
        caseRuleAudits={[]}
        opinionReferenceNeeds={[]}
        sourceRequests={[]}
        onStart={vi.fn()}
        onSetMode={vi.fn()}
        onRefresh={vi.fn()}
        onRerollDeveloper={vi.fn()}
        onResetDeveloper={vi.fn()}
        onSaveTicketReview={vi.fn()}
        onWriteTickets={vi.fn()}
        onExportTickets={vi.fn()}
        ticketToolStatus={null}
        onPurchaseUpgrade={onPurchaseUpgrade}
        upgradeStatus={null}
      />,
    );

    expect(screen.getByText('1.035×')).toBeVisible();
    expect(container.querySelector('.office-illustration .plant')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Move into an outpatient clinic' })).toBeVisible();
    screen.getByRole('button', { name: 'Buy for 1,800 pts' }).click();
    expect(onPurchaseUpgrade).toHaveBeenCalledWith('upgrade.facility.outpatient-clinic');
  });

  it('collects plain-language instructions without exposing internal ticket statuses', async () => {
    const onSaveTicketReview = vi.fn().mockResolvedValue(undefined);
    const ticket = ClinicalReviewTicketSchema.parse({
      schemaVersion: 1,
      id: 'ticket.review.mdd-path',
      title: 'Review the broad MDD treatment pathway',
      sourceKind: 'source_claim',
      sourceAuthority: 'source_document',
      ticketType: 'treatment_pathway',
      priority: 'high',
      status: 'proposed',
      requiresClinicalAcumen: true,
      attemptId: null,
      blueprintId: 'case.first-visit-depression',
      caseContentVersion: '3.0.0',
      receiptItemId: null,
      receiptItemSnapshot: null,
      targetContentIds: ['case.first-visit-depression', 'rule.mdd-emergency-escalation'],
      dependencyTicketIds: [],
      conflictContentIds: [],
      proposedRouting: 'Review the patient-owned pathway before changing content.',
      guidance: 'Decide what the broad first-line pathway should allow.',
      resurfacingTrigger: null,
      resolution: null,
      createdAt: '2026-07-22T12:00:00.000Z',
      updatedAt: '2026-07-22T12:00:00.000Z',
    });
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 5,
      profile: { ...startingProfile, progressionMode: 'developer' },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [ticket],
      attemptReviews: [],
      legacyArchive: [],
    });
    const whoReviewBlueprint = developerCaseBlueprints.find(
      (blueprint) => blueprint.id === 'case.review.who-mhgap-mdd-initial',
    )!;
    const whoReviewPreview = instantiateCase(whoReviewBlueprint, 'who-review-preview', catalogs);
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={saveData.profile.clinic}
        catalogs={catalogs}
        patientSlots={[
          {
            id: 'patient-slot-who-review',
            casePreview: whoReviewPreview,
            settingLabel: 'Integrated Center · Outpatient',
            locationId: 'location.endgame.outpatient',
          },
        ]}
        developerModeAvailable
        caseRuleAudits={[
          buildCaseRuleAudit(prototypeCaseBlueprint, catalogs, startingProfile.clinic),
        ]}
        opinionReferenceNeeds={developerOpinionReferenceNeeds}
        sourceRequests={developerSourceRequests.slice(0, 1)}
        onStart={vi.fn()}
        onSetMode={vi.fn()}
        onRefresh={vi.fn()}
        onRerollDeveloper={vi.fn()}
        onResetDeveloper={vi.fn()}
        onSaveTicketReview={onSaveTicketReview}
        onWriteTickets={vi.fn()}
        onExportTickets={vi.fn()}
        ticketToolStatus={null}
        onPurchaseUpgrade={vi.fn()}
        upgradeStatus={null}
      />,
    );

    expect(screen.queryByText(/linked review question/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Your response, judgment/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Clinical and content tickets'));
    fireEvent.click(
      await screen.findByText(ticket.title, {
        selector: '.review-ticket-inline strong',
      }),
    );
    const notes = await screen.findByLabelText(
      'Your response, judgment, or alternative references',
    );
    const saveButton = screen.getByRole('button', { name: 'Response saved' });
    expect(saveButton).toBeDisabled();
    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Current executable values/));
    expect((await screen.findAllByText('Emergency-department escalation')).length).toBeGreaterThan(
      0,
    );
    expect(await screen.findByText(/-450 pts/)).toBeVisible();
    expect(await screen.findByText('200 when true')).toBeVisible();
    expect(screen.getByText('Sources needed')).toBeVisible();
    expect(screen.getByText('Opinions needing references')).toBeVisible();
    fireEvent.click(screen.getByText('Opinions needing references'));
    expect(await screen.findByLabelText(/Search opinions/)).toBeVisible();
    fireEvent.click(screen.getByText('Medication fit'));
    expect(await screen.findByText(/Mirtazapine: bonus fit/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sources needed'));
    expect((await screen.findAllByText('PsychSim documents')).length).toBeGreaterThan(0);
    expect(screen.getByText('World Health Organization')).toBeVisible();

    fireEvent.change(notes, {
      target: { value: 'Allow any first-line SSRI, then apply medication-fit modifiers.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save response' }));

    expect(onSaveTicketReview).toHaveBeenCalledWith(
      ticket.id,
      'Allow any first-line SSRI, then apply medication-fit modifiers.',
    );
  });

  it('shows the exact literature-scout attachment only in local Developer mode', async () => {
    const ticket = developerClinicalAuditTickets.find(
      (candidate) => candidate.id === 'ticket.source.canmat-mdd.antidepressant-baseline',
    )!;
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 5,
      profile: { ...startingProfile, progressionMode: 'developer' },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [ticket],
      attemptReviews: [],
      legacyArchive: [],
    });
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={saveData.profile.clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable
        caseRuleAudits={[]}
        opinionReferenceNeeds={[]}
        sourceRequests={[]}
        ticketLiteratureScoutCatalog={developerTicketLiteratureScoutCatalog}
        onStart={vi.fn()}
        onSetMode={vi.fn()}
        onRefresh={vi.fn()}
        onRerollDeveloper={vi.fn()}
        onResetDeveloper={vi.fn()}
        onSaveTicketReview={vi.fn()}
        onWriteTickets={vi.fn()}
        onExportTickets={vi.fn()}
        ticketToolStatus={null}
        onPurchaseUpgrade={vi.fn()}
        upgradeStatus={null}
      />,
    );

    fireEvent.click(screen.getByText('Clinical and content tickets'));
    fireEvent.click(
      await screen.findByText(ticket.title, {
        selector: '.review-ticket-inline strong',
      }),
    );
    expect(await screen.findByText('Recent meta-analysis context')).toBeVisible();
    expect(screen.getByText('Abstract-only summary')).toBeVisible();
  });

  it('keeps the Developer literature scout out of portable Reviewer even if supplied', async () => {
    const ticket = developerClinicalAuditTickets.find(
      (candidate) => candidate.id === 'ticket.source.canmat-mdd.antidepressant-baseline',
    )!;
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 5,
      profile: { ...startingProfile, progressionMode: 'developer' },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [ticket],
      attemptReviews: [],
      legacyArchive: [],
    });
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={saveData.profile.clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable={false}
        reviewerBuild
        caseRuleAudits={[]}
        opinionReferenceNeeds={[]}
        sourceRequests={[]}
        ticketLiteratureScoutCatalog={developerTicketLiteratureScoutCatalog}
        onStart={vi.fn()}
        onSetMode={vi.fn()}
        onRefresh={vi.fn()}
        onRerollDeveloper={vi.fn()}
        onResetDeveloper={vi.fn()}
        onSaveTicketReview={vi.fn()}
        onWriteTickets={vi.fn()}
        onExportTickets={vi.fn()}
        ticketToolStatus={null}
        onPurchaseUpgrade={vi.fn()}
        upgradeStatus={null}
      />,
    );

    fireEvent.click(screen.getByText('Review tickets', { selector: 'strong' }));
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(ticket.title) }));
    expect(screen.queryByText('Recent meta-analysis context')).not.toBeInTheDocument();
  });

  it('opens portable Reviewer tickets in a focused dialog and saves the response', async () => {
    const onSaveTicketReview = vi.fn().mockResolvedValue(undefined);
    const ticket = ClinicalReviewTicketSchema.parse({
      schemaVersion: 1,
      id: 'ticket.reviewer-cohort.mdd-initial',
      title: 'Review the initial MDD patient and database plan',
      sourceKind: 'engine_audit',
      sourceAuthority: 'developer_observation',
      ticketType: 'clinical_conflict',
      priority: 'high',
      status: 'proposed',
      requiresClinicalAcumen: true,
      attemptId: null,
      blueprintId: 'case.first-visit-depression',
      caseContentVersion: '4.1.0',
      receiptItemId: null,
      receiptItemSnapshot: null,
      targetContentIds: ['case.first-visit-depression'],
      dependencyTicketIds: [],
      conflictContentIds: [],
      proposedRouting: 'Play the patient and describe the smallest desired change.',
      guidance: 'Review the history, workup, treatment ranking, and disposition.',
      resurfacingTrigger: null,
      resolution: null,
      createdAt: '2026-07-25T12:00:00.000Z',
      updatedAt: '2026-07-25T12:00:00.000Z',
    });
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 5,
      profile: { ...startingProfile, progressionMode: 'developer' },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [ticket],
      attemptReviews: [],
      legacyArchive: [],
    });
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={saveData.profile.clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable={false}
        reviewerBuild
        caseRuleAudits={[
          buildCaseRuleAudit(prototypeCaseBlueprint, catalogs, startingProfile.clinic),
        ]}
        opinionReferenceNeeds={[]}
        sourceRequests={[]}
        onStart={vi.fn()}
        onSetMode={vi.fn()}
        onRefresh={vi.fn()}
        onRerollDeveloper={vi.fn()}
        onResetDeveloper={vi.fn()}
        onSaveTicketReview={onSaveTicketReview}
        onWriteTickets={vi.fn()}
        onExportTickets={vi.fn()}
        ticketToolStatus={null}
        onPurchaseUpgrade={vi.fn()}
        upgradeStatus={null}
      />,
    );

    fireEvent.click(screen.getByText('Review tickets', { selector: 'strong' }));
    expect(
      screen.queryByRole('button', { name: 'Update Codex handoff file' }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole('button', {
        name: /Review the initial MDD patient and database plan/,
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Review the initial MDD patient and database plan',
    });
    const response = await screen.findByLabelText(
      'Your response, judgment, or alternative references',
    );
    fireEvent.change(response, {
      target: { value: 'Keep the pathway, but make the allergy-history omission visible.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save response' }));
    expect(onSaveTicketReview).toHaveBeenCalledWith(
      ticket.id,
      'Keep the pathway, but make the allergy-history omission visible.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(dialog).not.toHaveAttribute('open');
  });
});
