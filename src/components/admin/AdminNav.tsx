'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { User } from 'next-auth'

interface Props {
  user?: User
}

const navLinks = [
  { href: '/admin', label: 'الرئيسية', exact: true },
  { href: '/admin/rooms', label: 'القاعات' },
]

export default function AdminNav({ user }: Props) {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-slate-900 border-b border-slate-700 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 text-white font-bold text-lg">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="hidden sm:block">قاعات الاجتماعات</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* User / Logout */}
        <div className="flex items-center gap-3">
          {user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="w-8 h-8 rounded-full hidden sm:block" />
          )}
          <span className="text-slate-300 text-sm hidden sm:block truncate max-w-[150px]">
            {user?.name || user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            خروج
          </button>
        </div>
      </div>
    </nav>
  )
}
