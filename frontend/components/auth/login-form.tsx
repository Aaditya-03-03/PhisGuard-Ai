"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { Lock, Mail, Eye, EyeOff, Chrome, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { signIn, signInWithGoogle, loading, error, clearError } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
    } catch {
      // Error is handled in context
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch {
      // Error is handled in context
    }
  }

  return (
    <GlassCard variant="strong" className="p-8 glow-cyan">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan/20 to-blue/20 flex items-center justify-center border border-cyan/30">
          <Lock className="w-8 h-8 text-cyan" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Secure Login</h1>
        <p className="text-muted-foreground">Access your AI Phishing Detection Dashboard</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-risk-high/10 border border-risk-high/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-risk-high flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-risk-high">{error}</p>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="text-risk-high/60 hover:text-risk-high"
          >
            ×
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-white">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-12 pr-4 py-3 bg-navy-lighter/80 border border-cyan/20 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20 transition-all"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-white">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-12 pr-12 py-3 bg-navy-lighter/80 border border-cyan/20 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-cyan/30 bg-navy-lighter text-cyan focus:ring-cyan/30"
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <Link href="#" className="text-cyan hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Submit button */}
        <GlowButton type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </GlowButton>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cyan/20" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-navy-light text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Google Sign In */}
      <GlowButton
        variant="secondary"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <Chrome className="w-5 h-5" />
        Continue with Google
      </GlowButton>

      {/* Sign up link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-cyan hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </GlassCard>
  )
}

