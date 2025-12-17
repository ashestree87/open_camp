import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-brand-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <Link to="/" className="flex items-center gap-3 sm:gap-4">
          {/* Logo Placeholder - Replace with your organization's logo */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-primary to-brand-dark rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white font-heading text-xl sm:text-2xl font-bold">O</span>
          </div>
          
          {/* Title - Customize for your organization */}
          <div className="min-w-0">
            <h1 className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-white uppercase tracking-wide truncate">
              Open Camp
            </h1>
            <p className="text-brand-primary font-heading text-xs sm:text-sm uppercase tracking-wider">
              Kids Camp Registration
            </p>
          </div>
        </Link>
      </div>
    </header>
  )
}
