/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AD_LINK_PRIMARY: string
  readonly VITE_AD_LINK_REDIRECT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
