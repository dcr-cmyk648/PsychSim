// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { catalogs, prototypeCaseBlueprint, startingProfile } from '@psychsim/content-runtime';
import { emptyPatientQueueState, instantiateCase } from '@psychsim/engine';
import { ClinicalReviewTicketSchema, SaveDataSchema } from '@psychsim/schemas';

import { ClinicHub } from './ClinicHub';

afterEach(cleanup);

describe('ClinicHub', () => {
  it('renders the persisted profile and a neutral accessible patient launch control', () => {
    const onStart = vi.fn();
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 4,
      profile: startingProfile,
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [],
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
        onStart={onStart}
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
    screen.getByRole('button', { name: `Open chart for ${casePreview.opening.title}` }).click();
    expect(onStart).toHaveBeenCalledWith('patient-slot-1');
  });

  it('shows data-driven upgrade economics and emits a purchase request', () => {
    const onPurchaseUpgrade = vi.fn();
    const saveData = SaveDataSchema.parse({
      schemaVersion: 1,
      saveDataVersion: 4,
      profile: {
        ...startingProfile,
        clinic: { ...startingProfile.clinic, clinicPoints: 1_500 },
      },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [],
      legacyArchive: [],
    });
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={saveData.profile.clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable
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
      saveDataVersion: 4,
      profile: { ...startingProfile, clinic },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [],
      legacyArchive: [],
    });
    const { container } = render(
      <ClinicHub
        saveData={saveData}
        clinicState={clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable
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
      targetContentIds: ['case.first-visit-depression'],
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
      saveDataVersion: 4,
      profile: { ...startingProfile, progressionMode: 'developer' },
      attempts: [],
      flags: [],
      patientQueues: emptyPatientQueueState(),
      clinicalTickets: [ticket],
      legacyArchive: [],
    });
    render(
      <ClinicHub
        saveData={saveData}
        clinicState={saveData.profile.clinic}
        catalogs={catalogs}
        patientSlots={[]}
        developerModeAvailable
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

    const notes = screen.getByLabelText('What should Codex do?');
    const saveButton = screen.getByRole('button', { name: 'Instructions saved' });
    expect(saveButton).toBeDisabled();
    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument();

    fireEvent.change(notes, {
      target: { value: 'Allow any first-line SSRI, then apply medication-fit modifiers.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save instructions' }));

    expect(onSaveTicketReview).toHaveBeenCalledWith(
      ticket.id,
      'Allow any first-line SSRI, then apply medication-fit modifiers.',
    );
  });
});
