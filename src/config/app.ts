/**
 * Open Camp - Application Configuration
 * 
 * This config is read from environment variables with sensible defaults.
 * For multi-tenant deployments, these can be overridden per-tenant.
 */

export interface AppConfig {
  // Organization
  orgName: string
  orgTagline: string
  contactEmail: string
  supportEmail: string
  
  // Branding
  logoUrl: string | null
  logoText: string
  primaryColor: string
  
  // Features
  features: {
    payments: boolean
    emailNotifications: boolean
    waitlist: boolean
    siblingDiscount: boolean
    multiChild: boolean
  }
  
  // Limits
  limits: {
    maxChildrenPerRegistration: number
    maxSpotsPerCamp: number
  }
}

// Default configuration - works out of the box
export const defaultConfig: AppConfig = {
  orgName: 'Open Camp',
  orgTagline: 'Kids Camp Registration',
  contactEmail: 'hello@example.com',
  supportEmail: 'support@example.com',
  
  logoUrl: null, // null = use text logo
  logoText: 'O',
  primaryColor: '#8B1538',
  
  features: {
    payments: true,
    emailNotifications: true,
    waitlist: true,
    siblingDiscount: true,
    multiChild: true,
  },
  
  limits: {
    maxChildrenPerRegistration: 5,
    maxSpotsPerCamp: 100,
  },
}

/**
 * Get config from window (injected by server) or use defaults
 * This allows runtime configuration without rebuilding
 */
export function getAppConfig(): AppConfig {
  // Check for runtime config injected into window
  if (typeof window !== 'undefined' && (window as any).__OPEN_CAMP_CONFIG__) {
    return { ...defaultConfig, ...(window as any).__OPEN_CAMP_CONFIG__ }
  }
  
  // Check for build-time env vars (Vite)
  const envConfig: Partial<AppConfig> = {}
  
  if (import.meta.env.VITE_ORG_NAME) {
    envConfig.orgName = import.meta.env.VITE_ORG_NAME
  }
  if (import.meta.env.VITE_ORG_TAGLINE) {
    envConfig.orgTagline = import.meta.env.VITE_ORG_TAGLINE
  }
  if (import.meta.env.VITE_CONTACT_EMAIL) {
    envConfig.contactEmail = import.meta.env.VITE_CONTACT_EMAIL
  }
  if (import.meta.env.VITE_LOGO_URL) {
    envConfig.logoUrl = import.meta.env.VITE_LOGO_URL
  }
  if (import.meta.env.VITE_LOGO_TEXT) {
    envConfig.logoText = import.meta.env.VITE_LOGO_TEXT
  }
  if (import.meta.env.VITE_PRIMARY_COLOR) {
    envConfig.primaryColor = import.meta.env.VITE_PRIMARY_COLOR
  }
  
  return { ...defaultConfig, ...envConfig }
}

// Singleton instance
let _config: AppConfig | null = null

export function useAppConfig(): AppConfig {
  if (!_config) {
    _config = getAppConfig()
  }
  return _config
}

// For worker/server-side usage
export function getWorkerConfig(env: Record<string, string | undefined>): AppConfig {
  return {
    ...defaultConfig,
    orgName: env.ORG_NAME || defaultConfig.orgName,
    orgTagline: env.ORG_TAGLINE || defaultConfig.orgTagline,
    contactEmail: env.CONTACT_EMAIL || defaultConfig.contactEmail,
    supportEmail: env.SUPPORT_EMAIL || defaultConfig.supportEmail,
    logoUrl: env.LOGO_URL || defaultConfig.logoUrl,
    logoText: env.LOGO_TEXT || defaultConfig.logoText,
    primaryColor: env.PRIMARY_COLOR || defaultConfig.primaryColor,
  }
}

