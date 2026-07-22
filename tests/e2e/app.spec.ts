import { expect, test } from '@playwright/test';

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
    /Manic and hypomanic symptoms, 25 points, in house/,
    /Suicide and self-harm assessment, 15 points, in house/,
  ]) {
    await page.getByRole('button', { name: actionName }).click();
  }

  await expect(page.getByText('80 pts', { exact: true }).first()).toBeVisible();
  await expect(
    page
      .locator('.result-card')
      .filter({ hasText: 'Suicide and self-harm assessment' })
      .getByText('+', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: /Sertraline/ }).click();
  await page.getByRole('button', { name: /Cognitive behavioral therapy/ }).click();
  await page.getByRole('button', { name: /Collaborative behavioral activation plan/ }).click();
  await expect(page.getByRole('button', { name: /Refer for urgent same-day/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Transfer to emergency care/ })).toBeVisible();
  await page.getByRole('button', { name: /Close outpatient follow-up/ }).click();
  await page.getByRole('button', { name: 'Lock in treatment' }).click();

  await expect(page.getByRole('heading', { name: '0 points vs database plan' })).toBeVisible();
  await expect(page.getByText('+1,070 pts')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Itemized case receipt' })).toBeVisible();
  await expect(page.getByText(/clinical score|clinical rank|optimal-plan/i)).toHaveCount(0);
  await expect(page.getByText(/case seed/i)).toHaveCount(0);
  const uncitedTrace = page
    .locator('.trace-list details')
    .filter({ hasText: 'Assess suicide risk and outpatient suitability' });
  await uncitedTrace.locator('summary').click();
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
  await page.getByLabel('Note').fill('Prototype review note');
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
  await expect(page.getByRole('heading', { name: 'Clinical and content tickets' })).toBeVisible();
  await expect(
    page.getByText('Set the broad first-line antidepressant baseline and fit modifiers'),
  ).toBeVisible();
  await expect(page.getByText(/Receipt guidance:/)).toBeVisible();
  await page.getByRole('button', { name: 'Save queue to workspace' }).click();
  await expect(
    page.getByText(
      /Saved \d+ ticket\(s\) to content\/generated\/local-review-tickets\/tickets.json/,
    ),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/psychsim-clinical-tickets-.*\.review-bundle\.json/);
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
