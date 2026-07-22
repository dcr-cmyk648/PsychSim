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
): EconomySettlement => {
  const configuration = caseInstance.economy;
  const satisfactionMultiplier = clinicState.satisfactionMultiplier;
  const grossPayout = Math.round(
    Math.max(
      0,
      configuration.baseReimbursement +
        pointReport.carePointsEarned +
        configuration.complexityBonus +
        configuration.challengeBonus,
    ) * satisfactionMultiplier,
  );
  const calculatedPayout = grossPayout - pointReport.actualWorkupExpense;
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
    operatingExpenses: pointReport.actualWorkupExpense,
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
