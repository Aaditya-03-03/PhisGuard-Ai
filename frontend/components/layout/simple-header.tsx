"use client"

import Link from "next/link"
import { Shield, ArrowLeft } from "lucide-react"

export function SimpleHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-md border-b border-cyan/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <Shield className="w-8 h-8 text-cyan group-hover:text-cyan/80 transition-colors" />
                            <div className="absolute inset-0 bg-cyan/20 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan to-blue bg-clip-text text-transparent">
                            PhishGuard AI
                        </span>
                    </Link>

                    {/* Back to Home */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Home</span>
                    </Link>
                </div>
            </div>
        </header>
    )
}
