import {
  buildDefaultPersonalKnowledgeInventoryTargets,
  buildPersonalKnowledgeLexicalInventory,
  loadAuthorizedAppleNotesInventorySource,
  writePrivatePersonalKnowledgeInventory,
} from './personal-knowledge-inventory';

const source = await loadAuthorizedAppleNotesInventorySource();
const inventory = buildPersonalKnowledgeLexicalInventory(
  source,
  buildDefaultPersonalKnowledgeInventoryTargets(),
);
await writePrivatePersonalKnowledgeInventory(inventory);

console.log('PASS private whole-corpus lexical inventory');
console.log(
  `${inventory.summary.eligibleSourceRevisions} eligible title/plaintext revisions; ${inventory.summary.matchedSourceRevisions} with safe-target matches; ${inventory.summary.unmatchedSourceRevisions} without.`,
);
console.log(
  `${inventory.summary.targetIdentityCount} safe target identities; ${inventory.summary.matchedTargetIdentityCount} mentioned; ${inventory.summary.totalMatches} boundary-aware literal matches.`,
);
console.log(
  `${inventory.summary.attachmentRecordsExcluded} attachment records and ${inventory.summary.ocrRecordsExcluded} OCR outputs excluded; remote Drive sources inspected: 0.`,
);
console.log(
  'Detailed output remains gitignored, private, unreviewed lexical triage with no clinical/gameplay effect.',
);
console.log(
  'No private title, source text, excerpt, source ID, target-specific source relation, or path was printed.',
);
