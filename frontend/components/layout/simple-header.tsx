"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CyberShield } from "@/components/ui/cyber-shield"

export function SimpleHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-md border-b border-cyan/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <CyberShield size="sm" animated={false} />
                        <span className="text-xl font-bold">
                            <span className="text-white">Phish</span>
                            <span className="text-cyan">Guard</span>
                            <span className="text-white"> AI</span>
                        </span>
                    </Link>

                    {/* Back button */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back</span>
                    </Link>
                </div>
            </div>
        </header>
    )
}
