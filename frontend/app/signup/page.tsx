import { SignupForm } from "@/components/auth/signup-form"
import { CyberShield } from "@/components/ui/cyber-shield"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-navy cyber-grid flex items-center justify-center p-4">
      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-muted-foreground hover:text-cyan transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Home</span>
      </Link>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <CyberShield size="md" />
          <span className="text-2xl font-bold text-white">
            Phish<span className="text-cyan">Guard</span> AI
          </span>
        </Link>

        {/* Signup Form */}
        <SignupForm />

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
