"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { Shield, Mail, Lock, Eye, EyeOff, User, Chrome, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const { signUp, signInWithGoogle, loading, error, clearError } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      return // Password mismatch - could show error
    }

    try {
      await signUp(formData.email, formData.password, formData.name)
    } catch {
      // Error is handled in context
    }
  }

  const handleGoogleSignUp = async () => {
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
          <Shield className="w-8 h-8 text-cyan" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-muted-foreground">Start protecting your inbox with AI</p>
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-white">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              className="w-full pl-12 pr-4 py-3 bg-navy-lighter/80 border border-cyan/20 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20 transition-all"
            />
          </div>
        </div>

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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
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

        {/* Confirm Password field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full pl-12 pr-4 py-3 bg-navy-lighter/80 border border-cyan/20 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/20 transition-all"
            />
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-sm text-risk-high">Passwords do not match</p>
          )}
        </div>

        {/* Submit button */}
        <GlowButton
          type="submit"
          variant="primary"
          className="w-full mt-6"
          disabled={loading || formData.password !== formData.confirmPassword}
        >
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
              Creating account...
            </span>
          ) : (
            "Create Account"
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

      {/* Google Sign Up */}
      <GlowButton
        variant="secondary"
        className="w-full"
        onClick={handleGoogleSignUp}
        disabled={loading}
      >
        <Chrome className="w-5 h-5" />
        Sign up with Google
      </GlowButton>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </GlassCard>
  )
}

