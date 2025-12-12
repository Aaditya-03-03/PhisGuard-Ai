"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { GlowButton } from "@/components/ui/glow-button"
import { CyberShield } from "@/components/ui/cyber-shield"
import { Menu, X } from "lucide-react"
import { useState } from "react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connect-gmail", label: "Connect Gmail" },
  { href: "/docs", label: "Documentation" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't show navbar on dashboard pages (they have sidebar)
  if (pathname.startsWith("/dashboard")) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <CyberShield size="sm" animated={false} />
            <span className="text-lg font-bold text-white">
              Phish<span className="text-cyan">Guard</span> AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === link.href ? "text-cyan glow-text-cyan" : "text-muted-foreground hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <GlowButton variant="ghost" size="sm">
                Login
              </GlowButton>
            </Link>
            <Link href="/dashboard">
              <GlowButton variant="primary" size="sm">
                Get Started
              </GlowButton>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-strong border-t border-cyan/20">
          <div className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-sm font-medium py-2",
                  pathname === link.href ? "text-cyan" : "text-muted-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/login">
                <GlowButton variant="secondary" size="sm" className="w-full">
                  Login
                </GlowButton>
              </Link>
              <Link href="/dashboard">
                <GlowButton variant="primary" size="sm" className="w-full">
                  Get Started
                </GlowButton>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
