/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_SHA: string
  readonly VITE_BUILD_TIME: string
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
