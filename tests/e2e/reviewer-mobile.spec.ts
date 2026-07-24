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
  await expectDocumentFitsViewport(page);

  await page
    .getByRole('button', { name: /Open chart for/ })
    .first()
    .click();
  const workspaceTabs = page.getByRole('tablist', { name: 'Case workspace panes' });
  await expect(workspaceTabs.getByRole('tab', { name: 'Patient' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
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

  await page.getByRole('button', { name: /Depressive symptoms, \d+ points, in house/ }).click();
  const secondDialog = page.getByRole('dialog');
  await expect(secondDialog).toBeVisible();
  await secondDialog.getByRole('button', { name: 'View revealed information' }).click();
  await expect(workspaceTabs.getByRole('tab', { name: 'Revealed' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expectDocumentFitsViewport(page);
  await expectWithinHorizontalViewport(page.locator('#mobile-panel-revealed'));

  const revealedResults = page.locator('.revealed-panel .result-list > li');
  await expect(revealedResults).toHaveCount(2);
  await expect(revealedResults.nth(0)).toContainText('Depressive symptoms');
  await expect(revealedResults.nth(1)).toContainText('Presenting problem and timeline');
  await page.getByRole('button', { name: 'Show oldest purchased result first' }).click();
  await expect(revealedResults.nth(0)).toContainText('Presenting problem and timeline');
  await expect(revealedResults.nth(1)).toContainText('Depressive symptoms');

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
  expect(
    await page
      .locator('#developer-review-title')
      .evaluate((element) => element.getBoundingClientRect().top < window.innerHeight),
  ).toBe(true);
  await expect(page.getByRole('heading', { name: 'Case and app experience notes' })).toBeVisible();
  await expect(
    page.getByText(/subjective comments about pacing, clarity, usability/i),
  ).toBeVisible();
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
    tickets: unknown[];
    completedAttempts: Array<{
      id: string;
      blueprintId: string;
      caseInstance: unknown;
      receipt: unknown;
    }>;
  };
  expect(bundle.exportVersion).toBe(5);
  expect(bundle.buildKind).toBe('portable_reviewer');
  expect(bundle.assignmentId).toBe('reviewer-assignment.common-psychiatry.2026-07');
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
});
