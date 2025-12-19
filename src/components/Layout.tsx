import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 dark:bg-brand-black light:bg-slate-50">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 mt-auto transition-colors duration-200 dark:border-gray-800 light:border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm dark:text-gray-500 light:text-gray-600">
          <p>© {new Date().getFullYear()} Open Camp. All rights reserved.</p>
          <p className="mt-2 space-x-4">
            <a 
              href="https://github.com/your-org/open-camp" 
              className="hover:text-brand-primary transition-colors dark:text-gray-400 light:text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Source (MIT)
            </a>
            <span className="dark:text-gray-700 light:text-gray-300">•</span>
            <a 
              href="/admin" 
              className="hover:text-brand-primary transition-colors dark:text-gray-400 light:text-gray-500"
            >
              Admin
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
