// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { catalogs, prototypeCaseBlueprint, startingProfile } from '@psychsim/content-runtime';
import { emptyPatientQueueState, instantiateCase } from '@psychsim/engine';
import { SaveDataSchema } from '@psychsim/schemas';

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
        onSetTicketStatus={vi.fn()}
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
        onSetTicketStatus={vi.fn()}
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
        onSetTicketStatus={vi.fn()}
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
});
