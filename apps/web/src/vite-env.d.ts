interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly VITE_PSYCHSIM_REVIEW_BUILD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  glob(pattern: string, options: { eager: true; import: string }): Record<string, unknown>;
}

declare const __PSYCHSIM_DISTRIBUTION__: {
  readonly schemaVersion: 1;
  readonly distributionId: string;
  readonly buildKind: 'player' | 'portable_reviewer';
  readonly channel: string;
};
