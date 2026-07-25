import {
  EconomySettlementSchema,
  type CaseInstance,
  type ClinicState,
  type ClinicalPointReport,
  type EconomySettlement,
} from '@psychsim/schemas';

export const calculateSettlement = (
  pointReport: ClinicalPointReport,
  clinicState: ClinicState,
  caseInstance: CaseInstance,
  treatmentExpenses = 0,
): EconomySettlement => {
  const configuration = caseInstance.economy;
  const satisfactionMultiplier = clinicState.satisfactionMultiplier;
  const positiveCarePoints = Math.max(0, pointReport.carePointsEarned);
  const carePointPenalty = Math.min(0, pointReport.carePointsEarned);
  const grossPayout = Math.round(
    Math.max(
      0,
      (configuration.baseReimbursement +
        positiveCarePoints +
        configuration.complexityBonus +
        configuration.challengeBonus) *
        satisfactionMultiplier +
        carePointPenalty,
    ),
  );
  const informationExpenses = pointReport.actualWorkupExpense;
  const operatingExpenses = informationExpenses + treatmentExpenses;
  const calculatedPayout = grossPayout - operatingExpenses;
  const netClinicPointsEarned = Math.max(0, calculatedPayout);
  const practiceMode = clinicState.debugUnlocksAllProgression;
  const bankedClinicPointsEarned = practiceMode ? 0 : netClinicPointsEarned;

  return EconomySettlementSchema.parse({
    schemaVersion: 1,
    baseReimbursement: configuration.baseReimbursement,
    carePoints: pointReport.carePointsEarned,
    complexityBonus: configuration.complexityBonus,
    challengeBonus: configuration.challengeBonus,
    satisfactionMultiplier,
    grossPayout,
    informationExpenses,
    treatmentExpenses,
    operatingExpenses,
    calculatedPayout,
    netClinicPointsEarned,
    bankedClinicPointsEarned,
    practiceMode,
    persistentPointsBefore: clinicState.clinicPoints,
    persistentPointsAfter: clinicState.clinicPoints + bankedClinicPointsEarned,
    lifetimePointsBefore: clinicState.lifetimePointsEarned,
    lifetimePointsAfter: clinicState.lifetimePointsEarned + bankedClinicPointsEarned,
  });
};
