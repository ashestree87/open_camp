/**
 * KV Setup Script
 * 
 * Run this after creating your KV namespace to set initial values.
 * 
 * Usage:
 *   npx wrangler kv:namespace create KV
 *   # Copy the ID to wrangler.toml
 *   
 *   # Set admin password (replace YOUR_PASSWORD)
 *   npx wrangler kv:key put --binding=KV "admin_password_hash" "$(echo -n 'YOUR_PASSWORD' | shasum -a 256 | cut -d' ' -f1)"
 *   
 *   # Set max spots
 *   npx wrangler kv:key put --binding=KV "max_spots" "20"
 *   
 *   # Set admin username (optional, defaults to 'admin')
 *   npx wrangler kv:key put --binding=KV "admin_username" "admin"
 */

// Helper to generate SHA-256 hash (for reference)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Example: Generate hash for a password
const examplePassword = 'your-secure-password'
hashPassword(examplePassword).then(hash => {
  console.log('Password:', examplePassword)
  console.log('SHA-256 Hash:', hash)
  console.log('')
  console.log('Run this command to set the admin password:')
  console.log(`npx wrangler kv:key put --binding=KV "admin_password_hash" "${hash}"`)
})

