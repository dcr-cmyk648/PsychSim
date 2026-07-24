# Recommended guideline intake map

This is the metadata-first intake for the nine sources proposed in the prior clinical-reasoning
review. It records what is available, what can be processed safely, and which decision ticket owns
the next step. It does **not** activate a diagnosis, workup requirement, treatment grade, safety
gate, disposition rule, or point value.

Bibliographic verification means that the issuing organization, title, version/date, identifier,
scope, and access terms were checked against an official publisher, government, or bibliographic
record. Medical review remains `unreviewed` for every source.

## Intake status

| Source                                            | Evidence ID                                               | Local source status                                                                                                | Next review ticket                                        |
| ------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| VA/DoD suicide-risk CPG, version 3.0 (2024)       | `evidence.va-dod.suicide-risk.2024`                       | Public PDF extracted as `source-document.3fdd289a235399016d65`                                                     | `ticket.source.va-dod-suicide-risk.2024-intake`           |
| NICE NG225 self-harm (2022; reviewed 2024)        | `evidence.nice.self-harm.ng225.2022`                      | Metadata only; NICE requires an AI-use licensing process                                                           | `ticket.source.nice-self-harm.ng225-access`               |
| APA BPD treatment guideline, second edition       | `evidence.apa.bpd-treatment.second-edition.2024`          | Metadata only; APA prohibits AI ingestion absent written permission                                                | `ticket.source.apa-bpd.2024-access-and-scope`             |
| APA delirium guideline, second edition (2025)     | `evidence.apa.delirium.2025`                              | Metadata only; APA prohibits AI ingestion absent written permission                                                | `ticket.source.apa-delirium.2025-access-and-scope`        |
| CANMAT adult-MDD update                           | `evidence.canmat.mdd-adults.2023-update`                  | CC BY PDF extracted as `source-document.412aade56104fd394503`; existing five clinical tickets remain authoritative | existing CANMAT ticket packet                             |
| CANMAT corrigendum (2025)                         | `evidence.canmat.mdd-adults.2023-update-corrigendum.2025` | Metadata and first-class `corrects` relation only                                                                  | `ticket.source.canmat-mdd.2025-corrigendum`               |
| BAP catatonia consensus guideline (2023)          | `evidence.bap.catatonia.2023`                             | CC BY PDF extracted as `source-document.1b36e6afa6c8a74a5a8a`                                                      | `ticket.source.bap-catatonia.2023-intake`                 |
| Singapore ACE GAD guideline (2025)                | `evidence.ace-singapore.gad.2025`                         | Metadata only; site terms require a permission determination                                                       | `ticket.source.ace-gad.2025-access-and-scope`             |
| ASAM-led benzodiazepine tapering guideline (2025) | `evidence.asam.benzodiazepine-tapering.2025`              | Metadata only; ASAM prohibits AI ingestion of its IP                                                               | `ticket.source.asam-benzodiazepine.2025-access-and-scope` |
| WHO mhGAP third edition (2023)                    | `evidence.who.mhgap-mns.2023`                             | Previously extracted as `source-document.90f1220536d6323b8d84`                                                     | existing WHO recommendation tickets                       |

The VA/DoD document now satisfies the “source received” threshold for the tracked suicide and
disposition evidence request. NICE is listed there as relevant metadata-only context, not as
received recommendation text. The request remains unresolved until the rule-level review decides
what the game should encode.

## Scope boundaries

- VA/DoD and NICE are candidate sources for structured safety observations and disposition
  decisions. They do not authorize a single numerical suicide-risk score.
- The APA BPD record is a **treatment** guideline. Diagnostic criteria and any affective-instability
  scale require their own independently reviewed records.
- Delirium and catatonia are future focused best-next-step patient families, not universal
  screening requirements for routine low-level depression encounters.
- The accepted catatonia workflow reserves a universally searchable BFCRS examination and weights
  catatonia patients toward hospital, inpatient, and consultation-liaison pools. Exact BFCRS item
  text remains gated by `ticket.source.bfcrs.1996-reuse` because public availability did not
  establish an explicit reproduction license.
- ACE is jurisdiction-specific GAD guidance. A GAD diagnostic standard, shared anxiety findings,
  and treatment guidance remain separate assets.
- The ASAM document concerns benzodiazepine tapering when risks may outweigh benefits. It is not a
  general anxiety-treatment or benzodiazepine-initiation source.
- WHO remains broad non-specialist context. CANMAT remains the more directly targeted adult-MDD
  candidate source already queued for review; neither source automatically outranks the other.

## Access and correction policy added in this pass

`EvidenceSourceDefinition` now stores partial publication/review dates, version label,
jurisdiction, population, setting, explicit full-text/reuse/AI/local-extraction status, license and
terms links, and source-to-source relations. A correction notice must point to the source it
corrects, and catalog validation rejects missing, duplicate, or self-referential relations.

This separates four states that must never be collapsed:

1. the publication exists;
2. PsychSim has lawful local text access;
3. a reviewer believes it supports a specific claim;
4. an executable game rule has been explicitly reviewed and versioned.

## Official records checked

- [VA/DoD suicide-risk guideline](https://www.healthquality.va.gov/guidelines/mh/srb/)
- [NICE NG225](https://www.nice.org.uk/guidance/ng225)
- [APA BPD guideline landing page](https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines/borderline-personality-disorder)
- [APA delirium guideline landing page](https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines/delirium)
- [CANMAT adult-MDD update](https://doi.org/10.1177/07067437241245384)
- [CANMAT corrigendum](https://doi.org/10.1177/07067437251349087)
- [BAP catatonia guideline](https://doi.org/10.1177/02698811231158232)
- [Singapore ACE GAD guideline](https://www.ace-hta.gov.sg/healthcare-professionals/ace-repository-for-clinical-guidelines/generalised-anxiety-disorder-easing-burden-and-enabling-remission/)
- [ASAM benzodiazepine tapering guideline](https://www.asam.org/quality-care/clinical-guidelines/benzodiazepine-tapering)
- [WHO mhGAP third edition](https://www.who.int/publications/i/item/9789240084278)
