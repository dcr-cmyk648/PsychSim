import { GeneratedInformationPurchaseInputSchema, type ServiceDefinition } from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import { resolveNativeGeneratedServiceQuote } from './generated-service-quote';

const service = (methods: ServiceDefinition['fulfillmentMethods']): ServiceDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'service.test.native-pricing',
  label: 'Synthetic native pricing service',
  fulfillmentMethods: methods,
});

const method = (
  id: string,
  operatingCost: number,
  kind: ServiceDefinition['fulfillmentMethods'][number]['kind'],
  options: {
    readonly qualityModifier?: number;
    readonly requiredStaffUpgradeId?: string;
  } = {},
): ServiceDefinition['fulfillmentMethods'][number] => ({
  id,
  label: `Synthetic ${id}`,
  kind,
  operatingCost,
  requiredCapabilities: [],
  ...(options.requiredStaffUpgradeId
    ? { requiredStaffUpgradeId: options.requiredStaffUpgradeId }
    : {}),
  qualityModifier: options.qualityModifier ?? 1,
});

describe('D-239 native generated information-service quote', () => {
  it('keeps the purchase command strict and rejects every caller-authored quote field', () => {
    expect(
      GeneratedInformationPurchaseInputSchema.parse({
        id: 'generated-information-purchase.test.strict',
        informationActionId: 'info.test.strict',
      }),
    ).toEqual({
      id: 'generated-information-purchase.test.strict',
      informationActionId: 'info.test.strict',
    });
    for (const injected of [
      { fulfillmentMethodId: 'fulfillment.injected' },
      { fulfillmentLabel: 'Injected' },
      { operatingCost: 0 },
      { externalCostAvoided: 999 },
      { upgradeSavings: 999 },
    ]) {
      expect(
        GeneratedInformationPurchaseInputSchema.safeParse({
          id: 'generated-information-purchase.test.strict',
          informationActionId: 'info.test.strict',
          ...injected,
        }).success,
      ).toBe(false);
    }
  });

  it('selects the cheapest available equivalent method and derives external savings', () => {
    const owner = service([
      method('fulfillment.outside', 500, 'outside_referral'),
      method('fulfillment.partner', 300, 'contracted_partner'),
      method('fulfillment.in-house', 70, 'in_house'),
    ]);
    expect(
      resolveNativeGeneratedServiceQuote({
        actionId: 'info.test.ecg',
        service: owner,
        availableMethodIds: ['fulfillment.partner', 'fulfillment.outside', 'fulfillment.in-house'],
      }),
    ).toMatchObject({
      ok: true,
      value: {
        method: { id: 'fulfillment.in-house', operatingCost: 70 },
        externalCostAvoided: 430,
        upgradeSavings: 0,
      },
    });
  });

  it('ignores unavailable cheaper methods and uses method ID as the stable cost tie-break', () => {
    const owner = service([
      method('fulfillment.a', 30, 'in_house'),
      method('fulfillment.b', 30, 'shared_service'),
      method('fulfillment.unavailable', 1, 'in_house'),
    ]);
    const forward = resolveNativeGeneratedServiceQuote({
      actionId: 'info.test.tie',
      service: owner,
      availableMethodIds: ['fulfillment.b', 'fulfillment.a'],
    });
    const reversed = resolveNativeGeneratedServiceQuote({
      actionId: 'info.test.tie',
      service: {
        ...owner,
        fulfillmentMethods: [...owner.fulfillmentMethods].reverse(),
      },
      availableMethodIds: ['fulfillment.a', 'fulfillment.b'],
    });
    expect(forward).toEqual(reversed);
    expect(forward).toMatchObject({
      ok: true,
      value: { method: { id: 'fulfillment.a', operatingCost: 30 } },
    });
  });

  it('derives staff savings against the cheapest available nonstaff workflow', () => {
    const owner = service([
      method('fulfillment.office', 30, 'in_house'),
      method('fulfillment.staff', 18, 'in_house', {
        requiredStaffUpgradeId: 'upgrade.staff.intake',
      }),
    ]);
    expect(
      resolveNativeGeneratedServiceQuote({
        actionId: 'info.test.medication-review',
        service: owner,
        availableMethodIds: ['fulfillment.office', 'fulfillment.staff'],
      }),
    ).toMatchObject({
      ok: true,
      value: {
        method: { id: 'fulfillment.staff', operatingCost: 18 },
        externalCostAvoided: 0,
        upgradeSavings: 12,
      },
    });
  });

  it('fails closed when available methods differ in quality or a method is absent', () => {
    const owner = service([
      method('fulfillment.standard', 20, 'in_house'),
      method('fulfillment.different', 10, 'in_house', {
        qualityModifier: 1.1,
      }),
    ]);
    expect(
      resolveNativeGeneratedServiceQuote({
        actionId: 'info.test.quality',
        service: owner,
        availableMethodIds: ['fulfillment.standard', 'fulfillment.different'],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'UNEQUAL_METHOD_QUALITY' },
    });
    expect(
      resolveNativeGeneratedServiceQuote({
        actionId: 'info.test.missing',
        service: owner,
        availableMethodIds: ['fulfillment.missing'],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'AVAILABLE_METHOD_MISSING' },
    });
  });
});
