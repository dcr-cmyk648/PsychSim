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

  await page.getByRole('button', { name: 'Database' }).click();
  await expect(page.getByRole('heading', { name: 'Database', level: 1 })).toBeFocused();
  await expectDocumentFitsViewport(page);
  const conditionCategory = page.getByRole('button', { name: /Modeled conditions 9/ });
  await expect(conditionCategory).toHaveAttribute('aria-pressed', 'true');
  await expectWithinHorizontalViewport(conditionCategory);
  await page.getByRole('searchbox', { name: 'Search database' }).fill('major depressive');
  await expect(page.getByText('Major depressive disorder')).toBeVisible();
  await expectDocumentFitsViewport(page);

  const medicationCategory = page.getByRole('button', { name: /Medications 125/ });
  await medicationCategory.click();
  await expectWithinHorizontalViewport(medicationCategory);
  await page.getByRole('searchbox', { name: 'Search database' }).fill('bupropion');
  await expect(page.getByText('Bupropion', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open full entry' }).click();
  await expect(page.getByRole('heading', { name: 'Bupropion', level: 1 })).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Entry content' })
      .getByText(/RxNorm identity snapshot dated 2026-07-06/),
  ).toBeVisible();
  await expectWithinHorizontalViewport(page.locator('.database-reader-shell'));
  const databaseNote = 'Phone database review: verify bupropion identity and source metadata.';
  await page
    .getByRole('textbox', { name: 'Your interpretation and instructions for Codex' })
    .fill(databaseNote);
  await page.getByRole('button', { name: 'Save comment', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    'Saved your comment on “Bupropion” in this browser.',
  );
  await expectDocumentFitsViewport(page);

  await page.reload();
  await page.getByRole('button', { name: 'Database' }).click();
  await page.getByRole('button', { name: /Medications 125/ }).click();
  await page.getByRole('searchbox', { name: 'Search database' }).fill('bupropion');
  await expect(page.getByText('Comment saved')).toBeVisible();
  await page.getByRole('button', { name: 'Open full entry' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Your interpretation and instructions for Codex' }),
  ).toHaveValue(databaseNote);
  await page.getByRole('button', { name: 'Back to database' }).click();

  const referencesCategory = page.getByRole('button', { name: /Formal references 27/ });
  await referencesCategory.click();
  await expectWithinHorizontalViewport(referencesCategory);
  await page.getByRole('searchbox', { name: 'Search database' }).fill('CANMAT');
  const canmatReference = page
    .locator('.database-record-launcher')
    .filter({ has: page.getByText('evidence.canmat.mdd-adults.2023-update', { exact: true }) });
  await canmatReference.getByRole('button', { name: 'Open full entry' }).click();
  await expect(page.getByRole('link', { name: 'Open source page' })).toBeVisible();
  await expectDocumentFitsViewport(page);
  await page.getByRole('button', { name: 'Back to database' }).click();

  await page.getByRole('button', { name: /All \d+/ }).click();
  await page.getByRole('searchbox', { name: 'Search database' }).fill('ticket.reviewer-cohort');
  await expect(page.getByRole('status')).toContainText('0 matches');
  await expect(page.getByText(/No catalog records match/)).toBeVisible();
  await expect(page.getByText('Personal knowledge workbench')).toHaveCount(0);
  await expectDocumentFitsViewport(page);
  await page.getByRole('button', { name: 'Back to clinic' }).click();
  await expect(page.getByRole('button', { name: 'Database' })).toBeFocused();

  await expect(page.getByRole('button', { name: 'Reviewer' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByText(/stored only in this browser on this device until you export/i),
  ).toBeVisible();
  await expect(page.getByText('Review provenance')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Open chart for/ })).toHaveCount(0);
  await page.getByText('Patient queue', { exact: true }).click();
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
  const focusedTicket = page.locator('.focused-review-card');
  await expect(focusedTicket).toHaveCount(1);
  await expect(
    focusedTicket.getByRole('heading', {
      name: 'Recheck the initial MDD patient and database plan',
    }),
  ).toBeVisible();
  await expect(focusedTicket.getByText('Decision 1 of 10')).toBeVisible();
  await expectWithinHorizontalViewport(focusedTicket);
  await expect(focusedTicket.locator('.focused-review-audit-body')).toHaveCount(0);
  await focusedTicket
    .getByRole('textbox', { name: 'Your response, judgment, or alternative references' })
    .fill('Phone ticket review: keep the broad plan and show reaction-history effects clearly.');
  await focusedTicket.getByRole('button', { name: 'Save and go to next decision' }).click();
  await expect(
    focusedTicket.getByRole('heading', {
      name: 'Review the MDD adherence patient and database plan',
    }),
  ).toBeFocused();
  await expect(focusedTicket.getByText('Decision 2 of 10')).toBeVisible();
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
  const inCaseNote =
    'Phone in-case note: I want to remember why the mania-history result mattered here.';
  const scratchpad = page.getByRole('complementary', {
    name: 'Persistent case review notes',
  });
  await expect(scratchpad).toBeVisible();
  await expectWithinHorizontalViewport(scratchpad);
  expect(
    await scratchpad.evaluate((element) => {
      const rectangle = element.getBoundingClientRect();
      return rectangle.bottom <= window.innerHeight + 1 && rectangle.height >= 56;
    }),
  ).toBe(true);
  await scratchpad.getByRole('button', { name: /Case notes/ }).click();
  const scratchpadTextarea = scratchpad.getByRole('textbox', {
    name: 'Record clinical, scoring, content, or general app observations',
  });
  await expect(scratchpadTextarea).toBeFocused();
  await scratchpadTextarea.fill(inCaseNote);
  await expect(scratchpad.getByRole('status')).toHaveText('Saved locally');
  await expectWithinHorizontalViewport(scratchpad);
  await scratchpad.getByRole('button', { name: 'Close' }).click();
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
  const reopenedAction = page.getByRole('button', {
    name: /Presenting problem and timeline, \d+ points, in house, revealed/,
  });
  await page.keyboard.press('Escape');
  await expect(firstDialog).toBeHidden();
  await expect(reopenedAction).toBeFocused();
  await reopenedAction.click();
  await expect(firstDialog).toBeVisible();
  await firstDialog.getByRole('button', { name: 'Close' }).click();
  await expect(firstDialog).toBeHidden();
  await expect(reopenedAction).toBeFocused();

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
  await secondDialog.getByRole('button', { name: 'View in Revealed information' }).click();
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

  await workspaceTabs.getByRole('tab', { name: 'Plan' }).click();
  await expectDocumentFitsViewport(page);
  await expectWithinHorizontalViewport(page.locator('#mobile-panel-treatment'));
  await page
    .getByRole('tablist', { name: 'Final answer section' })
    .getByRole('tab', { name: 'Disposition' })
    .click();
  await page.locator('.disposition-picker .picker-option').first().click();
  await page.getByRole('button', { name: 'Lock in final answer' }).click();

  await expect(workspaceTabs.getByRole('tab', { name: 'Results / review' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expectWithinHorizontalViewport(
    workspaceTabs.getByRole('tab', { name: 'Results / review' }),
  );
  await expectDocumentFitsViewport(page);
  await expectWithinHorizontalViewport(page.locator('#mobile-panel-results'));
  await expect(page.locator('.mobile-receipt-item-list')).toBeVisible();
  await expect(page.locator('.desktop-receipt-table')).toBeHidden();
  await expectWithinHorizontalViewport(page.locator('.mobile-receipt-item-list'));
  await expect(page.locator('.mobile-receipt-item-list > li').first()).toContainText(/care pts/);
  await expect(page.locator('.mobile-receipt-item-list > li').first()).toContainText(/Cost/);
  await expect(page.locator('#score-comparison-title')).toBeFocused();
  await expect(page.locator('.point-seal')).toHaveCount(0);
  await expect(page.getByText(/points vs database plan/i)).toHaveCount(0);
  const scoreMeter = page.getByRole('meter', {
    name: 'Player care points compared with the database plan',
  });
  await expect(scoreMeter).toHaveCount(1);
  await expectWithinHorizontalViewport(scoreMeter);
  await expect(page.getByRole('heading', { name: 'Case and app experience notes' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Your feedback' })).toHaveValue(inCaseNote);
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
  await page.getByText('Review this case against queued decisions').click();
  const linkedDecision = page.locator('.receipt-linked-review-card');
  await expect(linkedDecision).toHaveCount(1);
  await expect(linkedDecision.getByText('Linked decision 1 of 1')).toBeVisible();
  await linkedDecision
    .getByRole('textbox', { name: 'Your response, judgment, or alternative references' })
    .fill('Phone linked decision: keep this question attached to the exact completed patient.');
  await linkedDecision.getByRole('button', { name: 'Save and finish linked decisions' }).click();
  await expect(
    page.getByText('Every question linked to this patient has a saved response.'),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Your feedback' })
    .fill('Phone review one: the investigation flow was clear.');
  await page.getByRole('button', { name: 'Save feedback and open next patient' }).click();
  await expect(page.locator('#patient-chart-title')).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Patient' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Plan' }).click();
  await page
    .getByRole('tablist', { name: 'Final answer section' })
    .getByRole('tab', { name: 'Disposition' })
    .click();
  await page.locator('.disposition-picker .picker-option').first().click();
  await page.getByRole('button', { name: 'Lock in final answer' }).click();
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
    databaseEntryReviews: Array<{
      id: string;
      entryId: string;
      categoryId: string;
      projectionVersion: number;
      reviewerNote: string;
      entrySnapshot: {
        kind: string;
        id: string;
        normalizedIngredientName?: string;
        rxnormRxcui?: string;
        identityEvidenceSourceId?: string;
        classes?: string[];
      };
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
  expect(bundle.exportVersion).toBe(7);
  expect(bundle.buildKind).toBe('portable_reviewer');
  expect(bundle.assignmentId).toBe('reviewer-assignment.common-psychiatry.2026-07g');
  expect(bundle.attemptReviews).toHaveLength(2);
  expect(bundle.completedAttempts).toHaveLength(2);
  expect(bundle.databaseEntryReviews).toHaveLength(1);
  expect(bundle.databaseEntryReviews[0]).toMatchObject({
    id: 'database-review.medication.bupropion',
    entryId: 'medication.bupropion',
    categoryId: 'medications',
    projectionVersion: 1,
    reviewerNote: databaseNote,
    entrySnapshot: {
      kind: 'medication',
      id: 'medication.bupropion',
      normalizedIngredientName: 'bupropion',
      rxnormRxcui: '42347',
      identityEvidenceSourceId: 'evidence.nlm.rxnorm-cpc.2026-07-06',
      classes: expect.arrayContaining(['NDRI antidepressant']),
    },
  });
  expect(JSON.stringify(bundle.databaseEntryReviews)).not.toContain('pointDelta');
  expect(JSON.stringify(bundle.databaseEntryReviews)).not.toContain('sourceDocumentId');
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
  expect(
    bundle.tickets.some(
      (ticket) =>
        ticket.reviewerNotes ===
        'Phone linked decision: keep this question attached to the exact completed patient.',
    ),
  ).toBe(true);
  await download.delete();
  await page.close();
});
