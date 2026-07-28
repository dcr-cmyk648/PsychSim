import { FindingDefinitionSchema, type FindingDefinition } from '@psychsim/schemas';

import currentActiveSuicidalIdeationJson from '../../../content/catalogs/findings/definitions/current-active-suicidal-ideation.finding.json';
import currentDecreasedSleepNeedJson from '../../../content/catalogs/findings/definitions/current-decreased-sleep-need.finding.json';
import currentElevatedIrritableMoodJson from '../../../content/catalogs/findings/definitions/current-elevated-irritable-mood.finding.json';
import currentExcessiveGuiltJson from '../../../content/catalogs/findings/definitions/current-excessive-guilt.finding.json';
import currentHighRiskSpendingJson from '../../../content/catalogs/findings/definitions/current-high-risk-spending.finding.json';
import currentHypersomniaJson from '../../../content/catalogs/findings/definitions/current-hypersomnia.finding.json';
import currentIncreasedGoalDirectedActivityJson from '../../../content/catalogs/findings/definitions/current-increased-goal-directed-activity.finding.json';
import currentInsomniaJson from '../../../content/catalogs/findings/definitions/current-insomnia.finding.json';
import currentPassiveDeathWishJson from '../../../content/catalogs/findings/definitions/current-passive-death-wish.finding.json';
import currentPressuredSpeechJson from '../../../content/catalogs/findings/definitions/current-pressured-speech.finding.json';
import currentPsychomotorSlowingJson from '../../../content/catalogs/findings/definitions/current-psychomotor-slowing.finding.json';
import currentRacingThoughtsJson from '../../../content/catalogs/findings/definitions/current-racing-thoughts.finding.json';
import currentReducedAppetiteJson from '../../../content/catalogs/findings/definitions/current-reduced-appetite.finding.json';
import currentSelfReportedConcentrationDifficultyJson from '../../../content/catalogs/findings/definitions/current-self-reported-concentration-difficulty.finding.json';
import currentViolentIdeationJson from '../../../content/catalogs/findings/definitions/current-violent-ideation.finding.json';
import currentViolentIntentJson from '../../../content/catalogs/findings/definitions/current-violent-intent.finding.json';
import depressedMoodJson from '../../../content/catalogs/findings/definitions/depressed-mood.finding.json';
import difficultyControllingWorryJson from '../../../content/catalogs/findings/definitions/difficulty-controlling-worry.finding.json';
import excessiveWorryJson from '../../../content/catalogs/findings/definitions/excessive-worry.finding.json';
import muscleTensionJson from '../../../content/catalogs/findings/definitions/muscle-tension.finding.json';
import panicAttacksJson from '../../../content/catalogs/findings/definitions/panic-attacks.finding.json';
import recentViolentBehaviorJson from '../../../content/catalogs/findings/definitions/recent-violent-behavior.finding.json';
import reportedDelusionalBeliefsJson from '../../../content/catalogs/findings/definitions/reported-delusional-beliefs.finding.json';
import reportedHallucinationsJson from '../../../content/catalogs/findings/definitions/reported-hallucinations.finding.json';
import restlessnessJson from '../../../content/catalogs/findings/definitions/restlessness.finding.json';
import selfReportedCurrentFunctionalImpactJson from '../../../content/catalogs/findings/definitions/self-reported-current-functional-impact.finding.json';
import suicideAttemptHistoryJson from '../../../content/catalogs/findings/definitions/suicide-attempt-history.finding.json';

export const findingDefinitions: FindingDefinition[] = FindingDefinitionSchema.array()
  .parse([
    currentActiveSuicidalIdeationJson,
    currentDecreasedSleepNeedJson,
    currentElevatedIrritableMoodJson,
    currentExcessiveGuiltJson,
    currentHighRiskSpendingJson,
    currentHypersomniaJson,
    currentIncreasedGoalDirectedActivityJson,
    currentInsomniaJson,
    currentPassiveDeathWishJson,
    currentPressuredSpeechJson,
    currentPsychomotorSlowingJson,
    currentRacingThoughtsJson,
    currentReducedAppetiteJson,
    currentSelfReportedConcentrationDifficultyJson,
    currentViolentIdeationJson,
    currentViolentIntentJson,
    depressedMoodJson,
    difficultyControllingWorryJson,
    excessiveWorryJson,
    muscleTensionJson,
    panicAttacksJson,
    recentViolentBehaviorJson,
    reportedDelusionalBeliefsJson,
    reportedHallucinationsJson,
    restlessnessJson,
    selfReportedCurrentFunctionalImpactJson,
    suicideAttemptHistoryJson,
  ])
  .sort((left, right) => left.id.localeCompare(right.id));
