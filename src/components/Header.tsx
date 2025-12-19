import { Link } from 'react-router-dom'
import { useTheme } from './ThemeContext'
import { useAppConfig } from '../config/app'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const config = useAppConfig()
  
  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-brand-black border-gray-800' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 sm:gap-4">
            {/* Logo - supports image URL or text fallback */}
            {config.logoUrl ? (
              <img 
                src={config.logoUrl} 
                alt={config.orgName} 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-primary to-brand-dark rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-heading text-xl sm:text-2xl font-bold">
                  {config.logoText}
                </span>
              </div>
            )}
            
            {/* Title */}
            <div className="min-w-0">
              <h1 className={`font-heading text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide truncate ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {config.orgName}
              </h1>
              <p className="text-brand-primary font-heading text-xs sm:text-sm uppercase tracking-wider">
                {config.orgTagline}
              </p>
            </div>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
