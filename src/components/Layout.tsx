import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-800 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Open Camp. All rights reserved.</p>
          <p className="mt-2 space-x-4">
            <a 
              href="https://github.com/your-org/open-camp" 
              className="text-gray-400 hover:text-brand-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Source (MIT)
            </a>
            <span className="text-gray-700">•</span>
            <a 
              href="/admin" 
              className="text-gray-400 hover:text-brand-primary transition-colors"
            >
              Admin
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
