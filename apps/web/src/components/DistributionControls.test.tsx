// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DistributionControls } from './DistributionControls';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DistributionControls', () => {
  it('shows the current iPhone installation steps and local-storage warning', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<DistributionControls safeToReload showInstallControl />);
    fireEvent.click(screen.getByRole('button', { name: 'Install on iPhone' }));

    expect(screen.getByRole('heading', { name: 'Add PsychSim to the Home Screen' })).toBeVisible();
    expect(screen.getByText(/Tap Share, then choose Add to Home Screen/)).toBeVisible();
    expect(screen.getByText(/Turn on Open as Web App/)).toBeVisible();
    expect(screen.getByText(/may use separate device storage/)).toBeVisible();
  });

  it('offers a reload for a newer distribution only on a safe screen', async () => {
    const remoteId = '2222222222222222222222222222222222222222';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            schemaVersion: 1,
            distributionId: remoteId,
            buildKind: 'player',
            channel: 'local',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    const onNavigate = vi.fn();
    const { rerender } = render(
      <DistributionControls
        safeToReload={false}
        showInstallControl={false}
        onNavigate={onNavigate}
      />,
    );

    expect(await screen.findByRole('alert', { name: 'Application update' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Update after returning' })).toBeDisabled();
    rerender(
      <DistributionControls safeToReload showInstallControl={false} onNavigate={onNavigate} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Update now' }));

    await waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith(expect.stringContaining(`release=${remoteId}`)),
    );
  });
});
