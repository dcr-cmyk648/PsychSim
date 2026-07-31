import { FindingDefinitionSchema, type FindingDefinition } from '@psychsim/schemas';

import currentActiveSuicidalIdeationJson from '../../../content/catalogs/findings/definitions/current-active-suicidal-ideation.finding.json';
import currentAnhedoniaJson from '../../../content/catalogs/findings/definitions/current-anhedonia.finding.json';
import currentDecreasedSleepNeedJson from '../../../content/catalogs/findings/definitions/current-decreased-sleep-need.finding.json';
import currentElevatedIrritableMoodJson from '../../../content/catalogs/findings/definitions/current-elevated-irritable-mood.finding.json';
import currentExcessiveGuiltJson from '../../../content/catalogs/findings/definitions/current-excessive-guilt.finding.json';
import currentFatigueLowEnergyJson from '../../../content/catalogs/findings/definitions/current-fatigue-low-energy.finding.json';
import currentGrandiosityJson from '../../../content/catalogs/findings/definitions/current-grandiosity.finding.json';
import currentHighRiskSpendingJson from '../../../content/catalogs/findings/definitions/current-high-risk-spending.finding.json';
import currentHypersomniaJson from '../../../content/catalogs/findings/definitions/current-hypersomnia.finding.json';
import currentIncreasedAppetiteJson from '../../../content/catalogs/findings/definitions/current-increased-appetite.finding.json';
import currentIncreasedGoalDirectedActivityJson from '../../../content/catalogs/findings/definitions/current-increased-goal-directed-activity.finding.json';
import currentIndecisionJson from '../../../content/catalogs/findings/definitions/current-indecision.finding.json';
import currentInsomniaJson from '../../../content/catalogs/findings/definitions/current-insomnia.finding.json';
import currentObservedGrandiosityJson from '../../../content/catalogs/findings/definitions/current-observed-grandiosity.finding.json';
import currentObservedPsychomotorAgitationJson from '../../../content/catalogs/findings/definitions/current-observed-psychomotor-agitation.finding.json';
import currentObservedPsychomotorSlowingJson from '../../../content/catalogs/findings/definitions/current-observed-psychomotor-slowing.finding.json';
import currentObservedThoughtDisorganizationJson from '../../../content/catalogs/findings/definitions/current-observed-thought-disorganization.finding.json';
import currentPassiveDeathWishJson from '../../../content/catalogs/findings/definitions/current-passive-death-wish.finding.json';
import currentPessimismJson from '../../../content/catalogs/findings/definitions/current-pessimism.finding.json';
import currentPressuredSpeechJson from '../../../content/catalogs/findings/definitions/current-pressured-speech.finding.json';
import currentPsychomotorSlowingJson from '../../../content/catalogs/findings/definitions/current-psychomotor-slowing.finding.json';
import currentRacingThoughtsJson from '../../../content/catalogs/findings/definitions/current-racing-thoughts.finding.json';
import currentReducedAppetiteJson from '../../../content/catalogs/findings/definitions/current-reduced-appetite.finding.json';
import currentSelfReportedConcentrationDifficultyJson from '../../../content/catalogs/findings/definitions/current-self-reported-concentration-difficulty.finding.json';
import currentSelfReportedIdeasOfReferenceJson from '../../../content/catalogs/findings/definitions/current-self-reported-ideas-of-reference.finding.json';
import currentSelfReportedImpulsivityJson from '../../../content/catalogs/findings/definitions/current-self-reported-impulsivity.finding.json';
import currentSelfReportedPersecutoryIdeationJson from '../../../content/catalogs/findings/definitions/current-self-reported-persecutory-ideation.finding.json';
import currentSelfReportedPsychomotorAgitationJson from '../../../content/catalogs/findings/definitions/current-self-reported-psychomotor-agitation.finding.json';
import currentSelfReportedSuspiciousnessJson from '../../../content/catalogs/findings/definitions/current-self-reported-suspiciousness.finding.json';
import currentSelfReportedThoughtDisorganizationJson from '../../../content/catalogs/findings/definitions/current-self-reported-thought-disorganization.finding.json';
import currentSelfReportedWeaponAccessJson from '../../../content/catalogs/findings/definitions/current-self-reported-weapon-access.finding.json';
import currentSuicidePreparatoryBehaviorJson from '../../../content/catalogs/findings/definitions/current-suicide-preparatory-behavior.finding.json';
import currentUnintentionalWeightGainJson from '../../../content/catalogs/findings/definitions/current-unintentional-weight-gain.finding.json';
import currentUnintentionalWeightLossJson from '../../../content/catalogs/findings/definitions/current-unintentional-weight-loss.finding.json';
import currentViolentIdeationJson from '../../../content/catalogs/findings/definitions/current-violent-ideation.finding.json';
import currentViolentIntentJson from '../../../content/catalogs/findings/definitions/current-violent-intent.finding.json';
import currentWorthlessnessJson from '../../../content/catalogs/findings/definitions/current-worthlessness.finding.json';
import depressedMoodJson from '../../../content/catalogs/findings/definitions/depressed-mood.finding.json';
import difficultyControllingWorryJson from '../../../content/catalogs/findings/definitions/difficulty-controlling-worry.finding.json';
import excessiveWorryJson from '../../../content/catalogs/findings/definitions/excessive-worry.finding.json';
import muscleTensionJson from '../../../content/catalogs/findings/definitions/muscle-tension.finding.json';
import panicAttacksJson from '../../../content/catalogs/findings/definitions/panic-attacks.finding.json';
import pastEpisodicGrandiosityJson from '../../../content/catalogs/findings/definitions/past-episodic-grandiosity.finding.json';
import recentViolentBehaviorJson from '../../../content/catalogs/findings/definitions/recent-violent-behavior.finding.json';
import reportedDelusionalBeliefsJson from '../../../content/catalogs/findings/definitions/reported-delusional-beliefs.finding.json';
import reportedHallucinationsJson from '../../../content/catalogs/findings/definitions/reported-hallucinations.finding.json';
import restlessnessJson from '../../../content/catalogs/findings/definitions/restlessness.finding.json';
import selfReportedCurrentFunctionalImpactJson from '../../../content/catalogs/findings/definitions/self-reported-current-functional-impact.finding.json';
import suicidePreparatoryBehaviorHistoryJson from '../../../content/catalogs/findings/definitions/suicide-preparatory-behavior-history.finding.json';
import suicideAttemptHistoryJson from '../../../content/catalogs/findings/definitions/suicide-attempt-history.finding.json';

export const findingDefinitions: FindingDefinition[] = FindingDefinitionSchema.array()
  .parse([
    currentActiveSuicidalIdeationJson,
    currentAnhedoniaJson,
    currentDecreasedSleepNeedJson,
    currentElevatedIrritableMoodJson,
    currentExcessiveGuiltJson,
    currentFatigueLowEnergyJson,
    currentGrandiosityJson,
    currentHighRiskSpendingJson,
    currentHypersomniaJson,
    currentIncreasedAppetiteJson,
    currentIncreasedGoalDirectedActivityJson,
    currentIndecisionJson,
    currentInsomniaJson,
    currentObservedGrandiosityJson,
    currentObservedPsychomotorAgitationJson,
    currentObservedPsychomotorSlowingJson,
    currentObservedThoughtDisorganizationJson,
    currentPassiveDeathWishJson,
    currentPessimismJson,
    currentPressuredSpeechJson,
    currentPsychomotorSlowingJson,
    currentRacingThoughtsJson,
    currentReducedAppetiteJson,
    currentSelfReportedConcentrationDifficultyJson,
    currentSelfReportedIdeasOfReferenceJson,
    currentSelfReportedImpulsivityJson,
    currentSelfReportedPersecutoryIdeationJson,
    currentSelfReportedPsychomotorAgitationJson,
    currentSelfReportedSuspiciousnessJson,
    currentSelfReportedThoughtDisorganizationJson,
    currentSelfReportedWeaponAccessJson,
    currentSuicidePreparatoryBehaviorJson,
    currentUnintentionalWeightGainJson,
    currentUnintentionalWeightLossJson,
    currentViolentIdeationJson,
    currentViolentIntentJson,
    currentWorthlessnessJson,
    depressedMoodJson,
    difficultyControllingWorryJson,
    excessiveWorryJson,
    muscleTensionJson,
    panicAttacksJson,
    pastEpisodicGrandiosityJson,
    recentViolentBehaviorJson,
    reportedDelusionalBeliefsJson,
    reportedHallucinationsJson,
    restlessnessJson,
    selfReportedCurrentFunctionalImpactJson,
    suicidePreparatoryBehaviorHistoryJson,
    suicideAttemptHistoryJson,
  ])
  .sort((left, right) => left.id.localeCompare(right.id));
