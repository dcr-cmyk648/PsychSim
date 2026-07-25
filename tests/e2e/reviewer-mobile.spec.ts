import { readFile } from 'node:fs/promises';

import { expect, test, type Locator, type Page } from '@playwright/test';

const expectDocumentFitsViewport = async (page: Page): Promise<void> => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
};

const expectWithinHorizontalViewport = async (locator: Locator): Promise<void> => {
  expect(
    await locator.evaluate((element) => {
      const rectangle = element.getBoundingClientRect();
      return rectangle.left >= -1 && rectangle.right <= window.innerWidth + 1;
    }),
  ).toBe(true);
};

test('exposes the installable iPhone shell and exact distribution marker', async ({
  page,
  request,
}) => {
  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    id: string;
    start_url: string;
    scope: string;
    display: string;
    icons: Array<{ src: string }>;
  };
  expect(manifest).toMatchObject({
    id: './',
    start_url: './',
    scope: './',
    display: 'standalone',
  });
  expect(manifest.icons.map((icon) => icon.src)).toEqual(
    expect.arrayContaining([
      './icons/psychsim-192.png',
      './icons/psychsim-512.png',
      './icons/psychsim.svg',
    ]),
  );

  const versionResponse = await request.get('/version.json');
  expect(versionResponse.ok()).toBe(true);
  const version = (await versionResponse.json()) as {
    schemaVersion: number;
    distributionId: string;
    buildKind: string;
    channel: string;
  };
  expect(version.schemaVersion).toBe(1);
  expect(version.distributionId).toMatch(/^(?:development|[0-9a-f]{7,64})$/);
  expect(version.buildKind).toBe('portable_reviewer');
  expect(version.channel).toBe('local');
  for (const icon of ['psychsim-180.png', 'psychsim-192.png', 'psychsim-512.png']) {
    expect((await request.get(`/icons/${icon}`)).ok()).toBe(true);
  }

  await page.goto('/');
  await page.getByRole('button', { name: 'Install on iPhone' }).click();
  const installDialog = page.getByRole('dialog', { name: 'Add PsychSim to the Home Screen' });
  await expect(installDialog).toBeVisible();
  await expect(installDialog).toContainText('Add to Home Screen');
  await expect(installDialog).toContainText('Open as Web App');
  await expect(installDialog).toContainText('may use separate device storage');
  await expectWithinHorizontalViewport(installDialog);
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Check for update' }).click();
  await expect(page.getByRole('status')).toContainText('current distribution');
  await expectDocumentFitsViewport(page);
});

test('reviews multiple patients on a phone and exports one exact feedback bundle', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Reviewer' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByText(/stored only in this browser on this device until you export/i),
  ).toBeVisible();
  await expect(page.getByText('Review provenance')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Open chart for/ }).first()).toBeVisible();
  const patientQueue = page.locator('.patient-slot-grid');
  const patientCards = patientQueue.locator(':scope > .case-card');
  expect(await patientCards.count()).toBeGreaterThan(1);
  expect(
    await patientQueue.evaluate((queue) => {
      const cards = [...queue.querySelectorAll<HTMLElement>(':scope > .case-card')];
      const queueRect = queue.getBoundingClientRect();
      const firstRect = cards[0]!.getBoundingClientRect();
      const secondRect = cards[1]!.getBoundingClientRect();
      return (
        queue.scrollWidth > queue.clientWidth &&
        Math.abs(firstRect.top - secondRect.top) <= 1 &&
        secondRect.left < queueRect.right &&
        secondRect.right > queueRect.right
      );
    }),
  ).toBe(true);
  await patientCards
    .last()
    .getByRole('button', { name: /Open chart for/ })
    .focus();
  await expect.poll(() => patientQueue.evaluate((queue) => queue.scrollLeft)).toBeGreaterThan(0);
  expect(
    await patientQueue.evaluate((queue) => {
      const lastButton = queue.querySelector<HTMLElement>(
        ':scope > .case-card:last-child button[aria-label^="Open chart for"]',
      );
      if (!lastButton) return false;
      const queueRect = queue.getBoundingClientRect();
      const buttonRect = lastButton.getBoundingClientRect();
      return buttonRect.left >= queueRect.left - 1 && buttonRect.right <= queueRect.right + 1;
    }),
  ).toBe(true);
  await expectDocumentFitsViewport(page);
  await expect(page.locator('#ticket-queue-title')).toBeVisible();
  await expect(page.getByLabel('10 need input')).toBeVisible();
  await page.locator('#ticket-queue-title').click();
  await page
    .getByRole('button', { name: /Review the initial MDD patient and database plan/ })
    .click();
  const ticketDialog = page.getByRole('dialog', {
    name: 'Review the initial MDD patient and database plan',
  });
  await expect(ticketDialog).toBeVisible();
  await expectWithinHorizontalViewport(ticketDialog);
  expect(
    await ticketDialog.evaluate((element) => {
      const rectangle = element.getBoundingClientRect();
      return rectangle.width >= window.innerWidth - 1 && rectangle.height >= window.innerHeight - 1;
    }),
  ).toBe(true);
  await ticketDialog
    .getByRole('textbox', { name: 'Your response, judgment, or alternative references' })
    .fill('Phone ticket review: keep the broad plan and show reaction-history effects clearly.');
  await ticketDialog.getByRole('button', { name: 'Save response' }).click();
  await ticketDialog.getByRole('button', { name: 'Close' }).click();
  await expect(ticketDialog).toBeHidden();
  await expectDocumentFitsViewport(page);

  await page
    .getByRole('button', { name: /Open chart for/ })
    .nth(2)
    .click();
  const workspaceTabs = page.getByRole('tablist', { name: 'Case workspace panes' });
  await expect(workspaceTabs.getByRole('tab', { name: 'Patient' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('#patient-chart-title')).toBeFocused();
  expect(
    await page.evaluate(() => {
      const notice = document.querySelector('.prototype-notice')?.getBoundingClientRect();
      const tabs = document.querySelector('.mobile-workflow-tabs')?.getBoundingClientRect();
      return Boolean(notice && tabs && notice.bottom <= tabs.top + 1);
    }),
  ).toBe(true);
  await workspaceTabs.getByRole('tab', { name: 'Investigate' }).click();
  await expectDocumentFitsViewport(page);
  await expectWithinHorizontalViewport(page.locator('#mobile-panel-investigate'));

  await page
    .getByRole('button', { name: /Presenting problem and timeline, \d+ points, in house/ })
    .click();
  const firstDialog = page.getByRole('dialog');
  await expect(firstDialog).toBeVisible();
  await expect(firstDialog).toContainText('Fulfilled by');
  await page.keyboard.press('Escape');
  await expect(firstDialog).toBeHidden();
  await expect(workspaceTabs.getByRole('tab', { name: 'Investigate' })).toBeFocused();

  await page
    .getByRole('button', { name: /Current and past mania or hypomania, \d+ points, in house/ })
    .click();
  const secondDialog = page.getByRole('dialog');
  await expect(secondDialog).toBeVisible();
  await expect(
    secondDialog
      .locator('.finding-outcome-chip')
      .filter({ hasText: /Absent|Negative/ })
      .first(),
  ).toBeVisible();
  await secondDialog.getByRole('button', { name: 'View revealed information' }).click();
  await expect(workspaceTabs.getByRole('tab', { name: 'Revealed' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expectDocumentFitsViewport(page);
  await expectWithinHorizontalViewport(page.locator('#mobile-panel-revealed'));

  const revealedResults = page.locator('.revealed-panel .result-list > li');
  await expect(revealedResults).toHaveCount(2);
  await expect(revealedResults.nth(0)).toContainText('Current and past mania or hypomania');
  await expect(revealedResults.nth(1)).toContainText('Presenting problem and timeline');
  await page.getByRole('button', { name: 'Show oldest purchased result first' }).click();
  await expect(revealedResults.nth(0)).toContainText('Presenting problem and timeline');
  await expect(revealedResults.nth(1)).toContainText('Current and past mania or hypomania');

  await workspaceTabs.getByRole('tab', { name: 'Treatment' }).click();
  await expectDocumentFitsViewport(page);
  await expectWithinHorizontalViewport(page.locator('#mobile-panel-treatment'));
  await page.locator('.disposition-picker .picker-option').first().click();
  await page.getByRole('button', { name: 'Lock in treatment' }).click();

  await expect(workspaceTabs.getByRole('tab', { name: 'Results / review' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expectWithinHorizontalViewport(
    workspaceTabs.getByRole('tab', { name: 'Results / review' }),
  );
  await expectDocumentFitsViewport(page);
  await expectWithinHorizontalViewport(page.locator('#mobile-panel-results'));
  await expect(page.locator('#score-comparison-title')).toBeFocused();
  await expect(page.locator('.point-seal')).toHaveCount(0);
  await expect(page.getByText(/points vs database plan/i)).toHaveCount(0);
  const scoreMeter = page.getByRole('meter', {
    name: 'Player care points compared with the database plan',
  });
  await expect(scoreMeter).toHaveCount(1);
  await expectWithinHorizontalViewport(scoreMeter);
  await expect(page.getByRole('heading', { name: 'Case and app experience notes' })).toBeVisible();
  await expect(
    page.getByText(/subjective comments about pacing, clarity, usability/i),
  ).toBeVisible();
  const sourcedTrace = page
    .locator('.trace-list details')
    .filter({ has: page.locator('.trace-provenance-badge', { hasText: /reference/ }) })
    .first();
  await expect(sourcedTrace).toBeVisible();
  await expect(sourcedTrace.locator('.trace-provenance-badge')).toContainText('reference');
  await sourcedTrace.locator('summary').click();
  await expect(sourcedTrace.getByText('References & provenance')).toBeVisible();
  const sourceLink = sourcedTrace.locator('.evidence-attributions a').first();
  await expect(sourceLink).toBeVisible();
  await expect(sourceLink).toHaveAttribute('href', /^https:\/\//);
  await expect(sourcedTrace.getByText(/Contribution:/).first()).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Your feedback' })
    .fill('Phone review one: the investigation flow was clear.');
  await page.getByRole('button', { name: 'Save feedback for Codex' }).click();
  await expect(page.getByRole('status')).toContainText('Feedback saved in this browser');

  await workspaceTabs.getByRole('tab', { name: 'Patient' }).click();
  await expect(page.locator('#mobile-panel-patient')).toBeVisible();
  await workspaceTabs.getByRole('tab', { name: 'Treatment' }).click();
  await expect(page.getByText('Treatment locked · review context only')).toBeVisible();
  await workspaceTabs.getByRole('tab', { name: 'Results / review' }).click();
  await page.getByRole('button', { name: 'Return to clinic' }).click();

  const savedCommentCount = page
    .locator('.review-export-counts > div')
    .filter({ hasText: 'Saved case comments' })
    .getByRole('definition');
  await expect(savedCommentCount).toHaveText('1');
  await page.reload();
  await expect(
    page.getByText(/stored only in this browser on this device until you export/i),
  ).toBeVisible();
  await expect(savedCommentCount).toHaveText('1');

  await page
    .getByRole('button', { name: /Open chart for/ })
    .first()
    .click();
  await page.getByRole('tab', { name: 'Treatment' }).click();
  await page.locator('.disposition-picker .picker-option').first().click();
  await page.getByRole('button', { name: 'Lock in treatment' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Export all saved feedback' })).toBeVisible();
  await page.getByRole('button', { name: 'Add feedback' }).click();
  await expect(page.getByRole('tab', { name: 'Results / review' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expectWithinHorizontalViewport(page.getByRole('tab', { name: 'Results / review' }));
  await expectDocumentFitsViewport(page);
  await expectWithinHorizontalViewport(page.locator('#mobile-panel-results'));
  await page
    .getByRole('textbox', { name: 'Your feedback' })
    .fill('Phone review two: the result comparison was easy to scan.');
  await page.getByRole('button', { name: 'Save feedback for Codex' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all saved feedback' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /psychsim-reviewer-feedback-.*\.review-bundle\.json/,
  );
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Reviewer feedback download did not expose a local path.');
  const bundle = JSON.parse(await readFile(downloadPath, 'utf8')) as {
    exportVersion: number;
    buildKind: string;
    assignmentId: string | null;
    attemptReviews: Array<{
      reviewerNote: string;
      availableOptions: unknown[];
      attemptSnapshot: { events: unknown[]; receipt: unknown };
    }>;
    flags: unknown[];
    tickets: Array<{ id: string; reviewerNotes: string; reviewerNotesUpdatedAt: string | null }>;
    completedAttempts: Array<{
      id: string;
      blueprintId: string;
      caseInstance: unknown;
      receipt: unknown;
    }>;
  };
  expect(bundle.exportVersion).toBe(5);
  expect(bundle.buildKind).toBe('portable_reviewer');
  expect(bundle.assignmentId).toBe('reviewer-assignment.common-psychiatry.2026-07e');
  expect(bundle.attemptReviews).toHaveLength(2);
  expect(bundle.completedAttempts).toHaveLength(2);
  expect(new Set(bundle.completedAttempts.map((attempt) => attempt.blueprintId)).size).toBe(2);
  expect(bundle.attemptReviews.map((review) => review.reviewerNote)).toEqual([
    'Phone review one: the investigation flow was clear.',
    'Phone review two: the result comparison was easy to scan.',
  ]);
  expect(bundle.attemptReviews.every((review) => review.availableOptions.length > 0)).toBe(true);
  expect(bundle.attemptReviews.every((review) => review.attemptSnapshot.events.length > 0)).toBe(
    true,
  );
  expect(bundle.tickets).toHaveLength(10);
  expect(
    bundle.tickets.find((ticket) => ticket.id === 'ticket.reviewer-cohort.mdd-initial'),
  ).toMatchObject({
    reviewerNotes:
      'Phone ticket review: keep the broad plan and show reaction-history effects clearly.',
    reviewerNotesUpdatedAt: expect.any(String),
  });
});
