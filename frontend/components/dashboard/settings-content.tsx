"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { GlowButton } from "@/components/ui/glow-button"
import { AlertBox } from "@/components/ui/alert-box"
import { Settings, Brain, Lock, User, Mail, RefreshCw, Trash2, Eye, EyeOff, LogOut, Check, AlertTriangle, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getGmailConnectUrl, checkGmailStatus, disconnectGmail, getAutoScanSettings, updateAutoScanSettings } from "@/lib/api"

export function SettingsContent() {
  const { user, logout } = useAuth()
  const router = useRouter()

  // Settings state
  const [autoScan, setAutoScan] = useState(true)
  const [autoScanInterval, setAutoScanInterval] = useState(15)
  const [selectedModel, setSelectedModel] = useState("rule-based")
  const [sensitivity, setSensitivity] = useState(75)
  const [showKey, setShowKey] = useState(false)
  const [lastAutoScan, setLastAutoScan] = useState<string | null>(null)

  // Gmail connection state
  const [gmailConnected, setGmailConnected] = useState(false)
  const [checkingGmail, setCheckingGmail] = useState(true)

  // Action states
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Check Gmail connection status on mount
  useEffect(() => {
    async function checkConnection() {
      try {
        const status = await checkGmailStatus()
        setGmailConnected(status.connected)
      } catch (error) {
        console.error('Failed to check Gmail status:', error)
      } finally {
        setCheckingGmail(false)
      }
    }
    checkConnection()
  }, [])

  // Load settings from server and localStorage on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        // Load from server
        const serverSettings = await getAutoScanSettings()
        setAutoScan(serverSettings.autoScanEnabled)
        setAutoScanInterval(serverSettings.autoScanInterval)
        setLastAutoScan(serverSettings.lastAutoScan)
      } catch (e) {
        console.error('Failed to load server settings:', e)
      }

      // Load local settings
      const savedSettings = localStorage.getItem('phishguard_settings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          setSelectedModel(settings.selectedModel ?? "rule-based")
          setSensitivity(settings.sensitivity ?? 75)
        } catch (e) {
          console.error('Failed to load local settings:', e)
        }
      }
    }
    loadSettings()
  }, [])

  // Save settings to server and localStorage
  const handleSaveSettings = async () => {
    setSavingSettings(true)

    try {
      // Save auto-scan settings to server
      await updateAutoScanSettings({
        autoScanEnabled: autoScan,
        autoScanInterval: autoScanInterval
      })

      // Save other settings to localStorage
      const settings = {
        selectedModel,
        sensitivity,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem('phishguard_settings', JSON.stringify(settings))

      setSavingSettings(false)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSavingSettings(false)
    }
  }

  // Handle Gmail re-authorization
  const handleReauthorizeGmail = () => {
    if (user?.uid) {
      window.location.href = getGmailConnectUrl(user.uid)
    }
  }

  // Handle Gmail disconnection
  const handleDisconnectGmail = async () => {
    setDisconnecting(true)
    try {
      const success = await disconnectGmail()
      if (success) {
        setGmailConnected(false)
      }
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error)
    } finally {
      setDisconnecting(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  // Handle account deletion (placeholder - would need backend implementation)
  const handleDeleteAccount = () => {
    // This would need a proper backend implementation
    alert('Account deletion requires server-side implementation. Please contact support.')
    setShowDeleteConfirm(false)
  }

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
              <p className="text-sm text-muted-foreground">Automatically scan emails in background</p>
            </div>
            <button
              onClick={() => setAutoScan(!autoScan)}
              className={`relative w-14 h-7 rounded-full transition-colors ${autoScan ? "bg-cyan" : "bg-navy-lighter"}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${autoScan ? "left-8" : "left-1"
                  }`}
              />
            </button>
          </div>

          {/* Auto-scan interval */}
          {autoScan && (
            <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan" />
                    Scan Interval
                  </h3>
                  <p className="text-sm text-muted-foreground">How often to check for new emails</p>
                </div>
                <select
                  value={autoScanInterval}
                  onChange={(e) => setAutoScanInterval(Number(e.target.value))}
                  className="px-4 py-2 bg-navy-lighter border border-cyan/20 rounded-xl text-white focus:outline-none focus:border-cyan/50"
                >
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                </select>
              </div>
              {lastAutoScan && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last auto-scan: {new Date(lastAutoScan).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Gmail Connection */}
          <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-white font-medium">Gmail Connection</h3>
                <p className="text-sm text-muted-foreground">
                  {checkingGmail ? 'Checking...' : gmailConnected ? 'Connected' : 'Not connected'}
                </p>
              </div>
              <div className="flex gap-2">
                {gmailConnected ? (
                  <>
                    <GlowButton variant="secondary" size="sm" onClick={handleReauthorizeGmail}>
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </GlowButton>
                    <GlowButton
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnectGmail}
                      disabled={disconnecting}
                    >
                      {disconnecting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      Disconnect
                    </GlowButton>
                  </>
                ) : (
                  <GlowButton variant="primary" size="sm" onClick={handleReauthorizeGmail}>
                    <Mail className="w-4 h-4" />
                    Connect Gmail
                  </GlowButton>
                )}
              </div>
            </div>
            {gmailConnected && (
              <div className="flex items-center gap-2 mt-2 text-sm text-risk-low">
                <Check className="w-4 h-4" />
                Gmail is connected and ready
              </div>
            )}
          </div>

          {/* Save button */}
          <GlowButton
            variant="primary"
            className="w-full"
            onClick={handleSaveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : settingsSaved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            {savingSettings ? 'Saving...' : settingsSaved ? 'Settings Saved!' : 'Save Settings'}
          </GlowButton>
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
              <option value="rule-based">Rule-Based Detection (Active)</option>
              <option value="distilbert">DistilBERT (Coming Soon)</option>
              <option value="custom">Custom Trained Model (Coming Soon)</option>
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

          <AlertBox variant="info">
            Higher sensitivity catches more threats but may have more false positives.
          </AlertBox>
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
            <label className="text-sm font-medium text-white mb-2 block">AES-256 Encryption Status</label>
            <div className="flex items-center gap-2 text-risk-low">
              <Check className="w-5 h-5" />
              <span>Active - All data is encrypted</span>
            </div>
          </div>

          <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
            <label className="text-sm font-medium text-white mb-2 block">Encryption Key (Server-side)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-navy-lighter rounded-xl font-mono text-sm border border-cyan/10 text-muted-foreground">
                {showKey ? "Managed by server - not exposed to frontend" : "••••••••••••••••••••••••••••••••"}
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-3 rounded-xl bg-navy-lighter hover:bg-cyan/10 text-muted-foreground hover:text-cyan transition-colors"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <AlertBox variant="success">
            Encryption keys are managed securely on the server and never exposed to the frontend.
          </AlertBox>
        </div>
      </GlassCard>

      {/* User Settings */}
      <GlassCard variant="strong">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-risk-medium/20">
            <User className="w-5 h-5 text-risk-medium" />
          </div>
          <h2 className="text-xl font-bold text-white">Account Settings</h2>
        </div>

        <div className="space-y-4">
          {/* User info */}
          {user && (
            <div className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10 mb-4">
              <p className="text-white font-medium">{user.displayName || 'User'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}

          <GlowButton variant="secondary" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </GlowButton>

          <div className="pt-4 border-t border-cyan/10">
            <h4 className="text-sm font-medium text-risk-high mb-3">Danger Zone</h4>

            {!showDeleteConfirm ? (
              <GlowButton
                variant="outline"
                className="w-full justify-start text-risk-high border-risk-high hover:bg-risk-high/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </GlowButton>
            ) : (
              <div className="space-y-3">
                <AlertBox variant="error">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    This action is permanent and cannot be undone!
                  </div>
                </AlertBox>
                <div className="flex gap-2">
                  <GlowButton
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </GlowButton>
                  <GlowButton
                    variant="outline"
                    className="flex-1 text-risk-high border-risk-high hover:bg-risk-high/10"
                    onClick={handleDeleteAccount}
                  >
                    Confirm Delete
                  </GlowButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
