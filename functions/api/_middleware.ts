// Import the Worker code
import worker from '../../src/worker'

// Pages Function middleware to handle all /api/* requests
export const onRequest: PagesFunction<{ DB: D1Database; KV: KVNamespace }> = async (context) => {
  // Forward the request to the Worker's fetch handler
  return worker.fetch(context.request, context.env, context)
}

