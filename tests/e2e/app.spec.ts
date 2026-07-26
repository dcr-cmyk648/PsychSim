import { expect, test } from '@playwright/test';

test('browses the safe runtime database without changing the clinic', async ({ page }) => {
  await page.goto('/');
  const waitingPatient = await page.locator('.case-card h3').first().textContent();
  await expect(page.getByText('APP & UPDATES', { exact: true })).toBeVisible();
  await expect(page.getByText('PHONE INSTALL', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Database' }).click();
  await expect(page.getByRole('heading', { name: 'Database', level: 1 })).toBeFocused();
  await expect(page.getByRole('button', { name: /Modeled conditions 8/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Major depressive disorder')).toBeVisible();
  await expect(page.getByText(/not a comprehensive diagnostic manual/i)).toBeVisible();

  await page.getByRole('button', { name: /Medications 33/ }).click();
  await page.getByRole('searchbox', { name: 'Search database' }).fill('sertraline');
  await expect(page.getByRole('status')).toContainText('1 matches');
  const sertraline = page
    .locator('.database-record-launcher')
    .filter({ has: page.getByText('Sertraline', { exact: true }) });
  await sertraline.getByRole('button', { name: 'Open full entry' }).click();
  await expect(page.getByRole('heading', { name: 'Sertraline', level: 1 })).toBeVisible();
  await expect(page.getByText('SSRI antidepressant', { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Entry content' })
      .getByText(/RxNorm identity snapshot dated 2026-07-06/),
  ).toBeVisible();
  await page.getByText('Complete structured record').click();
  const structuredRecord = page.locator('.database-structured-record pre');
  await expect(structuredRecord).toContainText('"id": "medication.sertraline"');
  await expect(structuredRecord).not.toContainText('pointDelta');
  await expect(structuredRecord).not.toContainText('sourceDocumentId');
  const databaseNote = 'Desktop database review: verify this identity and provenance.';
  await page.getByRole('textbox', { name: 'Comment for Codex' }).fill(databaseNote);
  await page.getByRole('button', { name: 'Save comment', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    'Saved your comment on “Sertraline” in browser storage and updated the Codex handoff file.',
  );
  await page.getByRole('button', { name: 'Back to database' }).click();

  await page.getByRole('button', { name: /All 129/ }).click();
  await page.getByRole('searchbox', { name: 'Search database' }).fill('ticket.');
  await expect(page.getByRole('status')).toContainText('0 matches');
  await expect(page.getByText(/No catalog records match/)).toBeVisible();

  await page.getByRole('button', { name: 'Back to clinic' }).click();
  await expect(page.getByRole('heading', { name: 'Lakeshore Psychiatric Office' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Database' })).toBeFocused();
  await expect(page.locator('.profile-stats').getByText('250', { exact: true })).toBeVisible();
  await expect(page.locator('.case-card h3').first()).toHaveText(waitingPatient ?? '');

  await page.reload();
  await page.getByRole('button', { name: 'Database' }).click();
  await page.getByRole('button', { name: /Medications 33/ }).click();
  await page.getByRole('searchbox', { name: 'Search database' }).fill('sertraline');
  await expect(page.getByText('Comment saved')).toBeVisible();
  await page.getByRole('button', { name: 'Open full entry' }).click();
  await expect(page.getByRole('textbox', { name: 'Comment for Codex' })).toHaveValue(databaseNote);
  await expect(page.getByRole('button', { name: 'Update comment' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to database' }).click();
  await page.getByRole('button', { name: 'Back to clinic' }).click();
});

test('completes a patient, stores review guidance, and preserves the profile and queue', async ({
  page,
}) => {
  await page.goto('/');

  await expect
    .poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).colorScheme))
    .toBe('dark');
  await expect(page.getByRole('heading', { name: 'Lakeshore Psychiatric Office' })).toBeVisible();
  await expect(
    page.getByText(/straightforward|depression case|first visit for low mood/i),
  ).toHaveCount(0);
  await expect(page.getByText('Solo Office · Outpatient Room')).toBeVisible();
  await expect(page.getByText(/case seed/i)).toHaveCount(0);
  const firstComplaint = await page.locator('.case-card .chief-complaint').innerText();

  await page.getByRole('button', { name: 'Endgame' }).click();
  await expect(
    page.getByRole('heading', { name: 'Behavioral-Health System · Endgame' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Open chart for/ })).toHaveCount(6);
  await page.getByRole('button', { name: 'Refresh slots' }).click();
  await page.getByRole('button', { name: 'Normal' }).click();
  await expect(page.getByRole('button', { name: /Open chart for/ })).toHaveCount(1);

  await page.getByRole('button', { name: /Open chart for/ }).click();
  await expect(page.getByText(/case seed/i)).toHaveCount(0);

  await page.getByRole('tab', { name: /Labs/ }).click();
  await expect(
    page.getByRole('button', { name: /Complete blood count, 160 points, sendout/ }),
  ).toBeVisible();
  await page.getByRole('tab', { name: /History/ }).click();

  for (const actionName of [
    /Presenting problem and timeline, 20 points, in house/,
    /Depressive symptoms, 20 points, in house/,
    /Current and past mania or hypomania, 25 points, in house/,
    /Suicide and self-harm assessment, 15 points, in house/,
  ]) {
    await page.getByRole('button', { name: actionName }).click();
  }
  await expect(page.getByRole('dialog')).toBeHidden();

  await expect(page.getByText('80 pts', { exact: true }).first()).toBeVisible();
  const positiveSafetyMarker = page
    .locator('.result-card')
    .filter({ hasText: 'Suicide and self-harm assessment' })
    .locator('.finding-outcome-chip')
    .filter({ hasText: 'Present' })
    .first();
  await expect(positiveSafetyMarker).toBeVisible();
  await expect(positiveSafetyMarker).toHaveCSS('color', 'rgb(255, 118, 94)');

  await page.getByRole('button', { name: /Sertraline/ }).click();
  await page.getByRole('button', { name: /Cognitive behavioral therapy/ }).click();
  await page.getByRole('button', { name: /Collaborative behavioral activation plan/ }).click();
  await expect(page.getByRole('button', { name: /Refer for urgent same-day/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Transfer to emergency care/ })).toBeVisible();
  await page.getByRole('button', { name: /Close outpatient follow-up/ }).click();
  await page.getByRole('button', { name: 'Lock in treatment' }).click();

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Major depressive disorder · Initial treatment',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/points vs database plan/i)).toHaveCount(0);
  await expect(
    page.getByRole('meter', { name: 'Player care points compared with the database plan' }),
  ).toHaveAttribute('aria-valuetext', '450 player care points; 515 database-plan care points');
  const planComparison = page.locator('.plan-comparison-panel');
  await expect(
    planComparison.getByRole('heading', {
      name: 'What you did vs the database-calculated plan',
    }),
  ).toBeVisible();
  await expect(planComparison.getByRole('heading', { name: 'Your submitted plan' })).toBeVisible();
  await expect(planComparison.getByRole('heading', { name: 'Database plan' })).toBeVisible();
  await expect(page.getByText('+1,070 pts')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Itemized case receipt' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Categorized rule trace' })).toBeVisible();
  const workupTraceCategory = page
    .locator('.trace-category')
    .filter({ has: page.getByRole('heading', { name: 'Workup' }) });
  await expect(workupTraceCategory).toContainText('point-relevant');
  await expect(page.locator('.zero-point-rules').first()).toBeVisible();
  await expect(page.getByText(/clinical score|clinical rank|optimal-plan/i)).toHaveCount(0);
  await expect(page.getByText(/case seed/i)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Case and app experience notes' })).toHaveCount(0);
  const uncitedTrace = page
    .locator('.trace-list details')
    .filter({ hasText: 'Assess suicide risk and outpatient suitability' });
  await expect(
    uncitedTrace.locator('summary').getByText('Expert opinion', { exact: true }),
  ).toBeVisible();
  await uncitedTrace.locator('summary').click();
  await expect(uncitedTrace.getByText('References & provenance')).toBeVisible();
  await expect(
    uncitedTrace.getByText(/Expert opinion: no formal publication is linked/),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add guidance' }).first().click();
  await page
    .getByRole('textbox', { name: 'Guidance', exact: true })
    .fill('Audit the point weight for this specific receipt item.');
  await page.getByRole('button', { name: 'Queue guidance' }).click();
  await expect(page.getByText(/Guidance saved as a proposed local review ticket/)).toBeVisible();

  await page.getByRole('button', { name: 'Flag', exact: true }).first().click();
  await page.getByLabel('Issue category').selectOption('needs_additional_source');
  await page.getByLabel('Note').fill('Find a more specific guideline for this rule.');
  await page.getByRole('button', { name: 'Save locally' }).click();
  await expect(page.getByText('Flag and clinical-review ticket saved locally.')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Lakeshore Psychiatric Office' })).toBeVisible();
  await expect(page.locator('.profile-stats').getByText('1,320', { exact: true })).toBeVisible();
  await expect(page.locator('.profile-stats').getByText('1,070', { exact: true })).toBeVisible();
  await expect(page.locator('.profile-stats').getByText('1', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Most recent: 450 care points' })).toBeVisible();
  await expect(page.locator('.case-card .chief-complaint')).not.toHaveText(firstComplaint);

  const ecgUpgrade = page
    .locator('.upgrade-card')
    .filter({ has: page.getByRole('heading', { name: 'Compact 12-lead ECG' }) });
  await expect(ecgUpgrade.getByText(/Outside medical clinic · 500 pts/)).toBeVisible();
  await expect(ecgUpgrade.getByText(/In-house ECG machine · 70 pts/)).toBeVisible();
  await ecgUpgrade.getByRole('button', { name: 'Buy for 1,200 pts' }).click();
  await expect(page.getByRole('status')).toContainText('120 points remain');
  await expect(page.getByText('ECG in house')).toBeVisible();
  await expect(ecgUpgrade.getByRole('button', { name: 'Owned' })).toBeDisabled();

  await page.reload();
  await expect(page.locator('.profile-stats').getByText('120', { exact: true })).toBeVisible();
  await expect(page.getByText('ECG in house')).toBeVisible();
  await expect(
    page
      .locator('.upgrade-card')
      .filter({ has: page.getByRole('heading', { name: 'Compact 12-lead ECG' }) })
      .getByRole('button', { name: 'Owned' }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'Developer' }).click();
  await page.getByText('Opinions needing references', { exact: true }).click();
  await expect(
    page.getByRole('searchbox', {
      name: 'Search opinions, rule IDs, medications, tests, or source requests',
    }),
  ).toBeVisible();
  await page.getByText('Sources needed', { exact: true }).click();
  await expect(page.locator('.source-request-card')).toHaveCount(10);
  await expect(
    page.getByText('Cyclothymia and duration-based near-miss generation', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Psychiatric medication combination and cross-titration boundaries', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('TSH use in an initial depressive presentation')).toBeVisible();
  await page.getByText('Clinical and content tickets', { exact: true }).click();
  const focusedTicket = page.locator('.focused-review-card');
  await expect(focusedTicket).toHaveCount(1);
  await expect(focusedTicket.getByText(/Decision 1 of \d+/)).toBeVisible();
  await expect(focusedTicket.getByRole('heading', { name: 'Decision needed' })).toBeVisible();
  await expect(focusedTicket.getByRole('heading', { name: 'Proposed direction' })).toBeVisible();
  await expect(
    focusedTicket.getByText('Related material, references, and exact audit'),
  ).toBeVisible();
  await expect(focusedTicket.locator('.focused-review-audit-body')).toHaveCount(0);
  const firstDecisionTitle =
    (await focusedTicket.locator('.focused-review-header h3').textContent()) ?? '';
  const firstDecisionResponse =
    'Review this proposal one at a time and preserve the linked evidence and exact audit.';
  await focusedTicket
    .getByLabel('Your response, judgment, or alternative references')
    .fill(firstDecisionResponse);
  await expect(focusedTicket.getByRole('combobox', { name: 'Status' })).toHaveCount(0);
  await focusedTicket.getByRole('button', { name: 'Save and go to next decision' }).click();
  await expect(
    page.getByText(/Saved your instructions.*updated the Codex handoff file/),
  ).toBeVisible();
  await expect(focusedTicket.locator('.focused-review-header h3')).not.toHaveText(
    firstDecisionTitle,
  );
  await expect(focusedTicket.getByText(/Decision \d+ of \d+/)).toBeVisible();
  await page.reload();
  await page.getByText('Clinical and content tickets', { exact: true }).click();
  await page.getByText(/Reviewed decision history · [1-9][0-9]*/).click();
  await page
    .locator('.reviewed-decision-list button')
    .filter({ hasText: firstDecisionTitle })
    .click();
  await expect(page.getByLabel('Your response, judgment, or alternative references')).toHaveValue(
    firstDecisionResponse,
  );
  await page.getByRole('button', { name: 'Update Codex handoff file' }).click();
  await expect(page.getByText(/tickets\.e2e\.json.*tell Codex the review is ready/)).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /psychsim-reviewer-feedback-.*\.review-bundle\.json/,
  );
});

test('saves a Developer case review with the exact patient, options, choices, and receipt', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Developer' }).click();
  await page.getByText('Patient queue', { exact: true }).click();
  await page
    .getByRole('button', { name: /Open chart for/ })
    .first()
    .click();
  const completedPatient = await page.locator('#patient-chart-title').textContent();

  await page
    .getByRole('button', { name: /Presenting problem and timeline, 20 points, in house/ })
    .click();
  await page.getByRole('button', { name: /Sertraline/ }).click();
  await page.getByRole('button', { name: /Close outpatient follow-up/ }).click();
  await page.getByRole('button', { name: 'Lock in treatment' }).click();

  const referenceAudit = page.locator('.plan-comparison-panel');
  await expect(
    referenceAudit.getByRole('heading', {
      name: 'What you did vs the database-calculated plan',
    }),
  ).toBeVisible();
  await expect(referenceAudit).toContainText(
    'not proof that every possible combination was exhaustively searched',
  );
  await expect(referenceAudit.getByRole('heading', { name: 'Your submitted plan' })).toBeVisible();
  await expect(referenceAudit.getByRole('heading', { name: 'Database plan' })).toBeVisible();
  await expect(
    referenceAudit.getByRole('heading', { name: 'Information and tests' }).first(),
  ).toBeVisible();
  await expect(
    referenceAudit.getByRole('heading', { name: 'Treatment and disposition' }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('meter', { name: 'Player care points compared with the database plan' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Case and app experience notes' })).toBeVisible();
  const reviewNote =
    'I missed suicide risk assessment and was not penalized. Sertraline should rank acceptable.';
  await page.getByRole('textbox', { name: 'Your feedback' }).fill(reviewNote);
  await page.getByRole('button', { name: 'Save feedback and open next patient' }).click();
  await expect(page.locator('#patient-chart-title')).toBeFocused();
  await expect(page.locator('#patient-chart-title')).not.toHaveText(completedPatient ?? '');

  const savedReview = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('psychsim-local-save', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('save-data', 'readonly');
    const save = await new Promise<{
      attemptReviews: Array<{
        reviewerNote: string;
        availableOptions: Array<{
          kind: string;
          optionId: string;
          label: string;
          selected: boolean;
          pointCost: number | null;
        }>;
        attemptSnapshot: {
          seed: string;
          caseInstance: { opening: { title: string }; informationActions: unknown[] };
          purchases: Array<{ actionId: string }>;
          submittedTreatment: {
            startMedicationIds: string[];
            dispositionId: string | null;
          };
          events: Array<{ type: string }>;
          receipt: { items: unknown[] };
        };
      }>;
    }>((resolve, reject) => {
      const request = transaction.objectStore('save-data').get('primary');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    const review = save.attemptReviews.at(-1);
    if (!review) throw new Error('Expected a saved Developer attempt review.');
    return review;
  });

  expect(savedReview.reviewerNote).toBe(reviewNote);
  expect(savedReview.attemptSnapshot.seed).toBeTruthy();
  expect(savedReview.attemptSnapshot.caseInstance.opening.title).toBeTruthy();
  expect(savedReview.attemptSnapshot.purchases).toEqual([
    expect.objectContaining({ actionId: 'info.history.presenting-problem' }),
  ]);
  expect(savedReview.attemptSnapshot.submittedTreatment).toMatchObject({
    startMedicationIds: ['medication.sertraline'],
    dispositionId: 'disposition.outpatient-followup',
  });
  expect(savedReview.attemptSnapshot.events.map((event) => event.type)).toEqual(
    expect.arrayContaining([
      'EncounterStarted',
      'InformationPurchased',
      'TreatmentSelectionsChanged',
      'EncounterSubmitted',
      'CarePointsCalculated',
      'SettlementCalculated',
    ]),
  );
  expect(savedReview.attemptSnapshot.receipt.items.length).toBeGreaterThan(0);
  expect(savedReview.availableOptions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        optionId: 'info.history.presenting-problem',
        selected: true,
        pointCost: 20,
      }),
      expect.objectContaining({
        optionId: 'info.history.suicide-safety',
        selected: false,
      }),
      expect.objectContaining({
        optionId: 'medication.sertraline',
        kind: 'start_medication',
        selected: true,
      }),
      expect.objectContaining({
        optionId: 'disposition.outpatient-followup',
        kind: 'disposition',
        selected: true,
      }),
    ]),
  );

  await page.reload();
  const persistedNote = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('psychsim-local-save', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('save-data', 'readonly');
    const note = await new Promise<string>((resolve, reject) => {
      const request = transaction.objectStore('save-data').get('primary');
      request.onsuccess = () =>
        resolve(
          (request.result as { attemptReviews: Array<{ reviewerNote: string }> }).attemptReviews[0]!
            .reviewerNote,
        );
      request.onerror = () => reject(request.error);
    });
    database.close();
    return note;
  });
  expect(persistedNote).toBe(reviewNote);
});

test('keeps Endgame practice rewards out of the standard point bank', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Endgame' }).click();
  await page
    .getByRole('button', { name: /Open chart for/ })
    .first()
    .click();
  await page.getByRole('button', { name: /Sertraline/ }).click();
  await page.getByRole('button', { name: /Close outpatient follow-up/ }).click();
  await page.getByRole('button', { name: 'Lock in treatment' }).click();

  await expect(page.getByText('Projected payout').first()).toBeVisible();
  await expect(page.getByText('Not banked')).toBeVisible();
  await page.getByRole('button', { name: 'Return to clinic' }).click();
  await expect(page.locator('.profile-stats').getByText('250', { exact: true })).toBeVisible();
  await expect(
    page.locator('.profile-stats').getByText('0', { exact: true }).first(),
  ).toBeVisible();
});

test('persists a threshold-gated facility move and visible decor', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Lakeshore Psychiatric Office' })).toBeVisible();

  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('psychsim-local-save', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('save-data', 'readwrite');
    const store = transaction.objectStore('save-data');
    const save = await new Promise<{
      profile: { clinic: { clinicPoints: number; lifetimePointsEarned: number } };
    }>((resolve, reject) => {
      const request = store.get('primary');
      request.onsuccess = () =>
        resolve(
          request.result as {
            profile: { clinic: { clinicPoints: number; lifetimePointsEarned: number } };
          },
        );
      request.onerror = () => reject(request.error);
    });
    save.profile.clinic.clinicPoints = 10_000;
    save.profile.clinic.lifetimePointsEarned = 2_500;
    await new Promise<void>((resolve, reject) => {
      const request = store.put(save, 'primary');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    database.close();
  });
  await page.reload();

  const plantCard = page
    .locator('.upgrade-card')
    .filter({ has: page.getByRole('heading', { name: 'Waiting-room pothos' }) });
  await plantCard.getByRole('button', { name: 'Buy for 300 pts' }).click();
  const facilityCard = page
    .locator('.upgrade-card')
    .filter({ has: page.getByRole('heading', { name: 'Move into an outpatient clinic' }) });
  await facilityCard.getByRole('button', { name: 'Buy for 1,800 pts' }).click();
  await expect(page.getByRole('heading', { name: 'Outpatient Psychiatric Clinic' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open chart for/ })).toHaveCount(2);

  const artCard = page
    .locator('.upgrade-card')
    .filter({ has: page.getByRole('heading', { name: 'Framed abstract print' }) });
  await artCard.getByRole('button', { name: 'Buy for 700 pts' }).click();
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Outpatient Psychiatric Clinic' })).toBeVisible();
  await expect(page.getByText('1.067×', { exact: true })).toBeVisible();
  await expect(page.locator('.office-illustration .plant')).toHaveCount(1);
  await expect(page.locator('.office-illustration.has-art')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Open chart for/ })).toHaveCount(2);
});
