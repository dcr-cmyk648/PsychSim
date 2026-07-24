# Diagnosis content

This directory contains two intentionally different layers.

## `definitions/`: playable clinical modules

Each file owns the small amount of reviewed diagnosis-family knowledge needed to generate and
grade focused PsychSim encounters. These definitions can contain structured criteria constraints,
severity branches, specifiers, qualitative treatment guidance, conflicts, and rule-level
provenance. They are runtime content and remain medically unreviewed until each rule is approved.

## `classifications/`: authoring background

Classification catalogs contain standardized codes and titles plus PsychSim-derived code-prefix
navigation only. They are developer-side reference data, never a source of executable criteria or
treatment rules, and are excluded from Git distribution and the production browser bundle.

The first catalog is the CDC/NCHS ICD-10-CM FY 2026 F01-F99 chapter:

- 1,112 terms;
- effective October 1, 2025 through September 30, 2026;
- manually compared with the April 1, 2026 update during the July 24 source audit, with no
  code/title difference found in the selected F01-F99 scope;
- generated deterministically from the official fixed-width order file;
- pinned by archive, member, and normalized-output SHA-256 hashes.

The generated `terms.json` is gitignored local data. Its narrow U.S. fair-use decision permits
private, noncommercial authoring/search only; it is not a claim that ICD-10-CM is public domain or
covered by ICD-11's Creative Commons terms. Seek NCHS/WHO permission before distributing or
commercializing the catalog.

Run:

```sh
pnpm content:diagnoses:validate
pnpm content:diagnoses:search -- "major depressive"
pnpm content:diagnoses:import -- /path/to/icd10cm-order-2026.txt
```

The importer verifies the official base-release member hash before replacing generated output. The
April XML artifact and its hashes are pinned in the release manifest, but the current April
comparison was manual rather than an automated validation step. Do not hand-edit `terms.json`. Add
a new immutable release directory and a reproducible release diff when CDC publishes a new
effective version.

A future playable definition may carry a compact reviewed classification binding. The binding
must state whether the PsychSim family is an exact, broader, narrower, or related concept. File
order and matching labels never create a mapping automatically.

Source-use decisions and fair-use policy live in
[`docs/SOURCE_USE_POLICY.md`](../../../docs/SOURCE_USE_POLICY.md) and
`content/catalogs/evidence/source-use-decisions.json`.
