/// <reference types="@cloudflare/workers-types" />

declare interface Env {
  DB: D1Database
  KV: KVNamespace
  ALLOWED_ORIGIN?: string
}

declare module '*.sql' {
  const content: string
  export default content
}

