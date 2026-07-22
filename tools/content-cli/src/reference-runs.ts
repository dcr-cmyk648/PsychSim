import {
  runAllApprovedReferenceSolutions,
  runEcgOwnershipComparison,
  type ReferenceRunResult,
} from '@psychsim/content-runtime';

const printRun = (result: ReferenceRunResult): void => {
  const { pointReport, settlement } = result.receipt;
  console.log(`\n${result.label}`);
  console.log(
    `  Care points: ${pointReport.carePointsEarned}; database plan ${pointReport.databasePlanCarePoints}; difference ${pointReport.differenceFromDatabasePlan >= 0 ? '+' : ''}${pointReport.differenceFromDatabasePlan}`,
  );
  console.log(
    `  Workup: database plan ${pointReport.databasePlanWorkupCost}; selected path ${pointReport.selectedPathWorkupCost}; actual ${pointReport.actualWorkupExpense}`,
  );
  console.log(
    `  Gross: ${settlement.baseReimbursement} base ${settlement.carePoints >= 0 ? '+' : '-'} ${Math.abs(settlement.carePoints)} care + ${settlement.complexityBonus} complexity + ${settlement.challengeBonus} challenge, × ${settlement.satisfactionMultiplier.toFixed(2)} = ${settlement.grossPayout}`,
  );
  console.log(
    `  Net: ${settlement.grossPayout} - ${settlement.operatingExpenses} investigation cost = ${settlement.calculatedPayout}; zero floor → ${settlement.netClinicPointsEarned} points`,
  );
  console.log(`  Banked/lifetime progression: +${settlement.bankedClinicPointsEarned} points`);
};

console.log('PsychSim prototype reference runs (fictional, synthetic, medically unreviewed)');
for (const caseReport of runAllApprovedReferenceSolutions()) {
  console.log(`\n=== ${caseReport.blueprintId} ===`);
  caseReport.runs.forEach(printRun);
}

const comparison = runEcgOwnershipComparison();
console.log('\n=== ECG ownership comparison ===');
console.log(
  `Outside: ${comparison.outside.receipt.pointReport.carePointsEarned} care points, ${comparison.outside.receipt.pointReport.actualWorkupExpense} workup points, ${comparison.outside.receipt.settlement.netClinicPointsEarned} payout points`,
);
console.log(
  `In house: ${comparison.inHouse.receipt.pointReport.carePointsEarned} care points, ${comparison.inHouse.receipt.pointReport.actualWorkupExpense} workup points, ${comparison.inHouse.receipt.settlement.netClinicPointsEarned} payout points`,
);
console.log(
  `Upgrade savings on identical care: ${comparison.inHouse.receipt.settlement.netClinicPointsEarned - comparison.outside.receipt.settlement.netClinicPointsEarned} points`,
);
