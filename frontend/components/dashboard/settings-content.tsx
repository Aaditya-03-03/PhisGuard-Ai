"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { AlertBox } from "@/components/ui/alert-box"
import { Settings, Brain, Lock, User, Mail, RefreshCw, Trash2, Eye, EyeOff } from "lucide-react"

export function SettingsContent() {
  const [autoScan, setAutoScan] = useState(true)
  const [selectedModel, setSelectedModel] = useState("distilbert")
  const [sensitivity, setSensitivity] = useState(75)
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* System Settings */}
      <GlassCard variant="strong">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-cyan/20">
            <Settings className="w-5 h-5 text-cyan" />
          </div>
          <h2 className="text-xl font-bold text-white">System Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Auto-scan toggle */}
          <div className="flex items-center justify-between p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
            <div>
              <h3 className="text-white font-medium">Auto-scan Gmail</h3>
              <p className="text-sm text-muted-foreground">Automatically scan new emails as they arrive</p>
            </div>
            <button
              onClick={() => setAutoScan(!autoScan)}
              className={`relative w-14 h-7 rounded-full transition-colors ${autoScan ? "bg-cyan" : "bg-navy-lighter"}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  autoScan ? "left-8" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Re-authorize Gmail */}
          <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-white font-medium">Gmail Connection</h3>
                <p className="text-sm text-muted-foreground">Re-authorize your Gmail account</p>
              </div>
              <GlowButton variant="secondary" size="sm">
                <Mail className="w-4 h-4" />
                Re-authorize
              </GlowButton>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* AI Model Settings */}
      <GlassCard variant="strong">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue/20">
            <Brain className="w-5 h-5 text-blue" />
          </div>
          <h2 className="text-xl font-bold text-white">AI Model Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Model selection */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Classification Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 bg-navy-lighter/80 border border-cyan/20 rounded-xl text-white focus:outline-none focus:border-cyan/50"
            >
              <option value="distilbert">DistilBERT (Recommended)</option>
              <option value="custom">Custom Trained Model</option>
              <option value="lightweight">Lightweight Model (Faster)</option>
            </select>
          </div>

          {/* Sensitivity slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white">Detection Sensitivity</label>
              <span className="text-cyan font-bold">{sensitivity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full h-2 bg-navy-lighter rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(39,243,214,0.5)]"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Less Strict</span>
              <span>More Strict</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Encryption Settings */}
      <GlassCard variant="strong">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-risk-low/20">
            <Lock className="w-5 h-5 text-risk-low" />
          </div>
          <h2 className="text-xl font-bold text-white">Encryption Settings</h2>
        </div>

        <div className="space-y-6">
          {/* AES key display */}
          <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
            <label className="text-sm font-medium text-white mb-2 block">AES-256 Encryption Key</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-navy-lighter rounded-xl font-mono text-sm border border-cyan/10">
                {showKey ? "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" : "••••••••••••••••••••••••••••••••"}
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-3 rounded-xl bg-navy-lighter hover:bg-cyan/10 text-muted-foreground hover:text-cyan transition-colors"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <GlowButton variant="secondary" className="w-full">
            <RefreshCw className="w-4 h-4" />
            Regenerate Encryption Key
          </GlowButton>

          <AlertBox variant="warning">
            Regenerating your encryption key will require re-encrypting all stored data. This may take several minutes.
          </AlertBox>
        </div>
      </GlassCard>

      {/* User Settings */}
      <GlassCard variant="strong">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-risk-medium/20">
            <User className="w-5 h-5 text-risk-medium" />
          </div>
          <h2 className="text-xl font-bold text-white">User Settings</h2>
        </div>

        <div className="space-y-4">
          <GlowButton variant="secondary" className="w-full justify-start">
            <Lock className="w-4 h-4" />
            Change Password
          </GlowButton>

          <GlowButton
            variant="outline"
            className="w-full justify-start text-risk-high border-risk-high hover:bg-risk-high/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </GlowButton>

          <AlertBox variant="error">Deleting your account is permanent and cannot be undone.</AlertBox>
        </div>
      </GlassCard>
    </div>
  )
}
