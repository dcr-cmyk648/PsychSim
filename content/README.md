# Runtime content contract

`content/registry.json` is the durable map of runtime content IDs to files, categories, and stable dependencies. Keep it in sync when a patient, medication, or shared catalog is added, moved, or removed. The validator rejects duplicate paths, broken dependency edges, missing registered runtime patients or medications, stale runtime entries, and paths that no longer exist.

## Ownership

- `catalogs/actions/actions.json` owns the universal investigation menu: neutral labels, descriptions, SOAP boundary, result source, service ID, and repeatability. It must not contain case hints.
- `catalogs/services/services.json` owns fulfillment methods and operating costs. Whether a result is clinically useful remains patient-specific.
- `catalogs/upgrades/upgrades.json` owns voluntary purchase cost, declarative gates, granted capabilities/formularies, related services, per-use economics, and unlock labels.
- `catalogs/locations/facilities.json` owns lifetime thresholds, persistent slot counts, location membership/defaults, and permitted purchases. Facility upgrades reference target facility IDs; they do not duplicate location configuration in React.
- `catalogs/decor/decor.json` owns visible environment items, raw satisfaction contributions, display tokens, and the diminishing-return multiplier configuration. Decor has no clinical-rule fields.
- Each file under `catalogs/evidence/formal/` owns one formal publication's stable ID, full citation metadata, identifiers/link, known byte hashes, bibliographic status, and separate medical-review status. Presence in this catalog never means the source supports a particular rule.
- Each file under `catalogs/treatments/definitions/` owns one reusable psychotherapy,
  behavioral, education, coping, sleep, or disposition choice. Selecting a psychotherapy records
  a recommendation of that modality now; it does not claim a delivered course, protocol fidelity,
  duration, or completion.
- `catalogs/medications/definitions/*.medication.json` gives each medication a stable file for class/tags and future medically reviewed fit modifiers or author overrides.
- `catalogs/medications/formularies.json` owns baseline and additive medication-ID sets. A formulary purchase grants an additional set; it never edits a patient file.
- `catalogs/demographics/variant-pools.json` owns curated nonclinical values such as fictional names, occupations, education, and locations.
- One file under `catalogs/tests/definitions/` owns each test's context profiles, UCUM units, reference intervals, normal-generation ranges, display precision, incidental-flag probability, and tightly bounded mild abnormal ranges.
- `catalogs/tests/reference-interval-sets.json` owns the reporting convention, unit convention, jurisdiction, range-authority status, policy sources, and review state referenced by those profiles.
- Each file under `cases/<lifecycle>/` is one patient blueprint. It owns hidden diagnoses, clinical tags, an internal starter/transitional/advanced pool, structured observations/labs, every case-specific investigation result, authored pathways, references/source-use notes, scoring, and reviewed variation policy.
- `cases/blueprints/*.json` may contain local `PatientScaffoldRequest` inputs. `pnpm content:draft <request>` verifies any cited local source/chunk IDs and emits one medically unreviewed `cases/review/*.case.json` plus blocking `*.tickets.json`; it never overwrites the template or infers a clinical rule from prose.

## Player-visible neutrality

Before the chart opens, show only the resolved fictional patient name and brief chief complaint. Do not surface filenames, metadata titles, diagnosis categories, difficulty interpretations, solution descriptions, or prose such as “straightforward case.” During the encounter, present only reportable Subjective or Objective information. Assessment, plan, scoring classifications, and rationales belong after submission.

## Updating knowledge

Patient files prefer one broad primary pathway using medication tags/counts so a reviewed catalog addition can be discovered by validation and future scoring tools. Medication-specific grades and fit modifiers refine that family; additional authored paths and safety fallbacks remain explicit. A combination outside those authored pathways must be labeled as engine-inferred in the receipt; it is not silently promoted to reviewed content. New articles first produce source claims and impact tickets with explicit target and affected IDs; they never rewrite every tagged case during ingestion.

Tracked `cases/review/*.tickets.json` packets may pose source-application questions without changing the patient. They remain Developer-only proposals until a user disposition leads to a separately versioned evidence contribution and rule edit.

Every evidence use is a contribution record. Formal uses cite one or more `evidence.*` catalog IDs, identify the exact target content IDs and contribution categories, and state what the publication contributed. Personal notes, notebooks, and uncited clinical judgment use `authority: "expert_opinion"` with no formal source ID. Empty source links on legacy/unreviewed rules are rendered as implicit Expert opinion; an approved rule must carry an explicit contribution record.

Medication rules, workup objectives, pathway requirements, scoring rules, and test-generation profiles carry their own review metadata. The current prototype rules remain medically unreviewed. The bupropion and mirtazapine files preserve human-authored prototype modifiers separately so later automated refreshes cannot overwrite them.

## Variation safety

Curated shared pools reduce phrase and demographic fingerprinting. Only declared noncritical fields vary. Unspecified numeric lab panels may generate deterministic values from reviewed test definitions. Ordinary values remain inside a narrower normal range; at most one component per panel may use an explicitly bounded mild flag range according to that panel's probability. These observations are marked noncritical and non-case-defining. Anything capable of changing the workup, safety rules, treatment paths, scoring, or disposition requires an explicit reviewed patient variant.

## Local source intake

Place only appropriate non-PHI PDF, DOCX, TXT, or Markdown files in `source-docs/inbox/`. `pnpm content:scan` hashes and records them; `pnpm content:extract` creates private document/chunk artifacts and retains originals; `pnpm content:review` lists extracted sources and playable review patients. All raw, processed, extracted, quarantined, manifest, and generated provenance data is gitignored and excluded from the web bundle. Document text is untrusted input and cannot execute or directly change clinical content.
