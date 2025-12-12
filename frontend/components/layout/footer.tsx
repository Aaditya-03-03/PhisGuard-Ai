import Link from "next/link"
import { CyberShield } from "@/components/ui/cyber-shield"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"

const footerLinks = {
  product: [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/connect-gmail", label: "Connect Gmail" },
    { href: "/status", label: "System Status" },
  ],
  resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/docs#api", label: "API Reference" },
    { href: "/docs#setup", label: "Setup Guide" },
    { href: "/docs#faq", label: "FAQs" },
  ],
  legal: [
    { href: "#privacy", label: "Privacy Policy" },
    { href: "#terms", label: "Terms of Service" },
    { href: "#security", label: "Security" },
  ],
}

const socialLinks = [
  { href: "#", icon: Github, label: "GitHub" },
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Linkedin, label: "LinkedIn" },
  { href: "#", icon: Mail, label: "Email" },
]

export function Footer() {
  return (
    <footer className="border-t border-cyan/20 bg-navy-light/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <CyberShield size="sm" animated={false} />
              <span className="text-lg font-bold text-white">
                Phish<span className="text-cyan">Guard</span> AI
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              AI-Powered Automated Phishing Detection. Protect your inbox with cutting-edge machine learning and AES-256
              encryption.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="p-2 rounded-lg bg-navy-lighter/50 text-muted-foreground hover:text-cyan hover:bg-cyan/10 transition-colors"
                  aria-label={link.label}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-cyan transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-cyan transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-cyan transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-cyan/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PhishGuard AI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Built with Next.js, Firebase, and AI/ML</p>
        </div>
      </div>
    </footer>
  )
}
