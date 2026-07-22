interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  glob(pattern: string, options: { eager: true; import: string }): Record<string, unknown>;
}
