import {
  PublicClinicalCatalogSupplementEntrySchema,
  type PublicClinicalCatalogSupplementEntry,
} from '@psychsim/schemas';

export const NLM_MESH_PUBLIC_ATTRIBUTION =
  'This product uses Medical Subject Headings (MeSH) data from the U.S. National Library of Medicine. NLM is not responsible for this product and does not endorse it.';

const publicSupplementJson = [
  {
    kind: 'supplement',
    categoryId: 'supplements',
    id: 'supplement.ashwagandha',
    label: 'Ashwagandha',
    logicalPath: 'catalogs.supplements.supplement.ashwagandha',
    contentVersion: '1.0.0',
    medicalReviewStatus: 'unreviewed',
    normalizedName: 'Withania somnifera',
    aliases: ['Indian ginseng', 'Winter cherry'],
    identityCategory: 'botanical',
    preparation: 'whole_botanical',
    identifiers: [
      {
        system: 'mesh',
        value: 'C030693',
        relationship: 'exact',
        sourceRelease: 'MeSH 2026',
      },
    ],
    identityScopeNote:
      'Identity-only botanical record. Root, leaf, and extract preparations remain distinct future authoring concepts; this record supplies no clinical claim.',
    identityAttribution: NLM_MESH_PUBLIC_ATTRIBUTION,
  },
  {
    kind: 'supplement',
    categoryId: 'supplements',
    id: 'supplement.lavender-oil',
    label: 'Lavender oil',
    logicalPath: 'catalogs.supplements.supplement.lavender-oil',
    contentVersion: '1.0.0',
    medicalReviewStatus: 'unreviewed',
    normalizedName: 'lavender oil',
    aliases: ['Lavender essential oil'],
    identityCategory: 'botanical',
    preparation: 'essential_oil',
    identifiers: [
      {
        system: 'mesh',
        value: 'C045718',
        relationship: 'exact',
        sourceRelease: 'MeSH 2026',
      },
      {
        system: 'rxnorm',
        value: '28486',
        relationship: 'exact',
        sourceRelease: 'RxNorm CPC 2026-07-06',
      },
    ],
    identityScopeNote:
      'Identity-only essential-oil record. Oral oil, aromatherapy, topical use, whole lavender, and standardized preparations must not be treated as interchangeable.',
    identityAttribution: NLM_MESH_PUBLIC_ATTRIBUTION,
  },
  {
    kind: 'supplement',
    categoryId: 'supplements',
    id: 'supplement.l-theanine',
    label: 'L-theanine',
    logicalPath: 'catalogs.supplements.supplement.l-theanine',
    contentVersion: '1.0.0',
    medicalReviewStatus: 'unreviewed',
    normalizedName: 'theanine',
    aliases: ['L-gamma-glutamylethylamide'],
    identityCategory: 'amino_acid_derivative',
    preparation: 'compound',
    identifiers: [
      {
        system: 'mesh',
        value: 'C026166',
        relationship: 'exact',
        sourceRelease: 'MeSH 2026',
      },
      {
        system: 'rxnorm',
        value: '38022',
        relationship: 'exact',
        sourceRelease: 'RxNorm CPC 2026-07-06',
      },
    ],
    identityScopeNote:
      'Identity-only compound record. It does not establish psychiatric efficacy, dosing, safety, or a gameplay modifier.',
    identityAttribution: NLM_MESH_PUBLIC_ATTRIBUTION,
  },
  {
    kind: 'supplement',
    categoryId: 'supplements',
    id: 'supplement.magnesium',
    label: 'Magnesium',
    logicalPath: 'catalogs.supplements.supplement.magnesium',
    contentVersion: '1.0.0',
    medicalReviewStatus: 'unreviewed',
    normalizedName: 'magnesium',
    aliases: ['Elemental magnesium'],
    identityCategory: 'mineral',
    preparation: 'element',
    identifiers: [
      {
        system: 'mesh',
        value: 'D008274',
        relationship: 'exact',
        sourceRelease: 'MeSH 2026',
      },
      {
        system: 'rxnorm',
        value: '6574',
        relationship: 'exact',
        sourceRelease: 'RxNorm CPC 2026-07-06',
      },
    ],
    identityScopeNote:
      'Identity-only parent-mineral record. Oxide, citrate, chloride, and other salts require separate preparation records.',
    identityAttribution: NLM_MESH_PUBLIC_ATTRIBUTION,
  },
  {
    kind: 'supplement',
    categoryId: 'supplements',
    id: 'supplement.s-adenosylmethionine',
    label: 'S-adenosylmethionine (SAMe)',
    logicalPath: 'catalogs.supplements.supplement.s-adenosylmethionine',
    contentVersion: '1.0.0',
    medicalReviewStatus: 'unreviewed',
    normalizedName: 'S-adenosylmethionine',
    aliases: ['SAMe', 'SAM-e', 'Ademetionine', 'AdoMet'],
    identityCategory: 'amino_acid_derivative',
    preparation: 'compound',
    identifiers: [
      {
        system: 'mesh',
        value: 'D012436',
        relationship: 'exact',
        sourceRelease: 'MeSH 2026',
      },
      {
        system: 'rxnorm',
        value: '9504',
        relationship: 'exact',
        sourceRelease: 'RxNorm CPC 2026-07-06',
      },
      {
        system: 'unii',
        value: '7LP2MPO46S',
        relationship: 'exact',
        sourceRelease: 'MeSH 2026 cross-reference',
      },
      {
        system: 'cas',
        value: '29908-03-0',
        relationship: 'exact',
        sourceRelease: 'MeSH 2026 cross-reference',
      },
    ],
    identityScopeNote:
      'Identity-only compound record. It does not establish psychiatric efficacy, dosing, safety, or a gameplay modifier.',
    identityAttribution: NLM_MESH_PUBLIC_ATTRIBUTION,
  },
  {
    kind: 'supplement',
    categoryId: 'supplements',
    id: 'supplement.saffron-extract',
    label: 'Saffron extract',
    logicalPath: 'catalogs.supplements.supplement.saffron-extract',
    contentVersion: '1.0.0',
    medicalReviewStatus: 'unreviewed',
    normalizedName: 'saffron extract',
    aliases: ['Crocus sativus extract'],
    identityCategory: 'botanical',
    preparation: 'extract',
    identifiers: [
      {
        system: 'mesh',
        value: 'D027622',
        relationship: 'broader_botanical',
        sourceRelease: 'MeSH 2026',
      },
      {
        system: 'rxnorm',
        value: '1484904',
        relationship: 'preparation_specific',
        sourceRelease: 'RxNorm CPC 2026-07-06',
      },
    ],
    identityScopeNote:
      'Identity-only extract record. Whole saffron or stigma and saffron extract must not be treated as interchangeable.',
    identityAttribution: NLM_MESH_PUBLIC_ATTRIBUTION,
  },
] as const;

export const publicSupplementCatalogEntries: readonly PublicClinicalCatalogSupplementEntry[] =
  PublicClinicalCatalogSupplementEntrySchema.array()
    .parse(publicSupplementJson)
    .sort((left, right) => left.label.localeCompare(right.label));
