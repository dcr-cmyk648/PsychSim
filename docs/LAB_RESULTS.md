# Laboratory results

## Reporting contract

PsychSim models laboratory results as structured observations rather than prose. A numeric result carries:

- stable test and component IDs;
- numeric value and preserved display precision;
- human-readable unit plus UCUM code;
- low/high reference-interval bounds;
- the rendered reference interval and applicable population label;
- reference-interval source ID;
- an `N`, `H`, or `L` interpretation derived from the value and interval;
- provenance (`authored`, `generated_normal`, or `generated_incidental`).

The encounter screen uses an EMR-like table: **Test · Result · Reference interval · Flag**. `H` and `L` are visibly emphasized; normal results still show `N` and the interval. The engine, not authored display text, verifies that a numeric result's flag agrees with its structured bounds.

## Standards basis

There is no single authoritative numeric “normal range” for every laboratory and patient. CMS CLIA materials state that a laboratory may use a manufacturer's interval only after verifying that it fits its patient population, including relevant demographic variables; otherwise it may verify an appropriate published interval. CLSI EP28-A3c similarly defines how laboratories establish, transfer, and verify reference intervals rather than publishing one universal table.

PsychSim therefore separates the reporting format from the numeric interval source:

- [US Core 9.0.0](https://hl7.org/fhir/us/core/STU9/) is the current U.S. interoperability profile family used as the reporting-shape reference.
- [FHIR Observation](https://hl7.org/fhir/R5/observation-definitions.html) supplies structured result, interpretation, and reference-range semantics. The compact `N`, `H`, and `L` flags follow the Observation Interpretation code family.
- [UCUM](https://ucum.org/docs/common-units) supplies machine-readable unit codes while the UI retains familiar display units.
- [CLSI EP28-A3c](https://clsi.org/shop/standards/ep28/) and the [CMS CLIA verification guidance](https://www.cms.gov/Regulations-and-Guidance/Legislation/CLIA/Downloads/6064bk.pdf) define the reference-interval policy.

Each test profile owns an explicit interval-set ID and population label. Future reviewed content can add age-, sex-, pregnancy-, method-, or location-specific profiles without changing the patient or UI schemas. The current prototype intervals are synthetic and medically unreviewed; they are architecture fixtures, not authoritative laboratory guidance.

## Generated incidental results

If the patient does not own a clinically meaningful result, a test profile may generate a deterministic value. Ordinary values stay inside a narrower generation range. A test-specific probability may produce at most one mild out-of-range component per panel. The generated value is marked `H` or `L`, but remains noncritical and non-case-defining; it cannot silently alter diagnosis, scoring, treatment safety, or disposition.

A clinically important abnormal result must be authored in the patient record or a separately reviewed patient variant. Updating any interval, outlier probability, or interpretation rule creates impact tickets for affected content rather than rewriting patient files automatically.
