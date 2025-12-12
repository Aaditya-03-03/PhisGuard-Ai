"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonBadge } from "@/components/ui/neon-badge"
import {
  Book,
  Workflow,
  Server,
  Brain,
  Lock,
  Database,
  Cloud,
  HelpCircle,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react"

const sections = [
  { id: "introduction", label: "Introduction", icon: Book },
  { id: "how-it-works", label: "How It Works", icon: Workflow },
  { id: "n8n-setup", label: "n8n Setup Guide", icon: Workflow },
  { id: "api", label: "Backend API Endpoints", icon: Server },
  { id: "ai-model", label: "AI Model Description", icon: Brain },
  { id: "encryption", label: "Encryption Layer", icon: Lock },
  { id: "database", label: "Database Schema", icon: Database },
  { id: "deployment", label: "Deployment Guide", icon: Cloud },
  { id: "faq", label: "FAQs", icon: HelpCircle },
]

const codeExamples = {
  api: `// Example API Request
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    email_content: "Email body text here",
    subject: "Email subject",
    sender: "sender@example.com"
  })
});

const result = await response.json();
// Returns: { phishing_probability: 0.92, risk_level: "HIGH" }`,

  encryption: `// AES-256 Encryption Implementation
import { createCipheriv, randomBytes } from 'crypto';

function encryptData(plaintext: string, key: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}`,

  database: `-- Firestore Collection Schema
// emails collection
{
  id: string,           // Auto-generated document ID
  sender: string,       // Email sender address
  subject: string,      // Email subject (encrypted)
  body_hash: string,    // SHA-256 hash of body
  risk_score: number,   // 0-100 risk assessment
  risk_level: string,   // 'HIGH' | 'MEDIUM' | 'LOW'
  urls: array,          // Extracted URLs (encrypted)
  analyzed_at: timestamp,
  created_at: timestamp
}`,
}

export function DocsContent() {
  const [activeSection, setActiveSection] = useState("introduction")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Documentation</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? "bg-cyan/10 text-cyan border border-cyan/30"
                        : "text-muted-foreground hover:text-white hover:bg-navy-lighter"
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </GlassCard>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile navigation */}
          <div className="lg:hidden mb-6">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full px-4 py-3 bg-navy-lighter border border-cyan/20 rounded-xl text-white"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          {/* Introduction */}
          {activeSection === "introduction" && (
            <GlassCard variant="strong" className="prose prose-invert max-w-none">
              <div className="flex items-center gap-3 mb-6">
                <NeonBadge variant="cyan">v1.0</NeonBadge>
                <h1 className="text-3xl font-bold text-white m-0">PhishGuard AI Documentation</h1>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                PhishGuard AI is an automated phishing email detection system that leverages artificial intelligence and
                machine learning to protect your inbox from malicious emails.
              </p>

              <h2 className="text-xl font-semibold text-white mt-8 mb-4">Key Features</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span>Automated Gmail integration via n8n workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span>DistilBERT-based NLP classification model</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span>AES-256 encryption for all sensitive data</span>
                </li>
                <li className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span>Real-time cloud dashboard with Firebase backend</span>
                </li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-8 mb-4">Quick Start</h2>
              <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
                <li>Create an account and log in</li>
                <li>Connect your Gmail account via OAuth</li>
                <li>Configure your detection settings</li>
                <li>Monitor your dashboard for threats</li>
              </ol>
            </GlassCard>
          )}

          {/* API Endpoints */}
          {activeSection === "api" && (
            <GlassCard variant="strong">
              <h1 className="text-3xl font-bold text-white mb-6">Backend API Endpoints</h1>

              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <NeonBadge variant="cyan">POST</NeonBadge>
                    <code className="text-white font-mono">/api/analyze</code>
                  </div>
                  <p className="text-muted-foreground mb-4">Analyze an email for phishing indicators.</p>

                  <div className="relative">
                    <pre className="bg-navy-lighter rounded-xl p-4 overflow-x-auto text-sm font-mono text-muted-foreground border border-cyan/10">
                      {codeExamples.api}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(codeExamples.api, "api")}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-navy-lighter hover:bg-cyan/10 text-muted-foreground hover:text-cyan transition-colors"
                    >
                      {copiedCode === "api" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <NeonBadge variant="blue">GET</NeonBadge>
                    <code className="text-white font-mono">/api/emails</code>
                  </div>
                  <p className="text-muted-foreground">Retrieve list of analyzed emails with pagination.</p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <NeonBadge variant="blue">GET</NeonBadge>
                    <code className="text-white font-mono">/api/emails/:id</code>
                  </div>
                  <p className="text-muted-foreground">Get detailed analysis for a specific email.</p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <NeonBadge variant="medium">PATCH</NeonBadge>
                    <code className="text-white font-mono">/api/emails/:id/status</code>
                  </div>
                  <p className="text-muted-foreground">Update the status of an email (mark as safe/report).</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Encryption */}
          {activeSection === "encryption" && (
            <GlassCard variant="strong">
              <h1 className="text-3xl font-bold text-white mb-6">Encryption Layer</h1>

              <p className="text-muted-foreground mb-6">
                PhishGuard AI uses AES-256-GCM encryption to protect all sensitive data, including email content, URLs,
                and OAuth tokens.
              </p>

              <h2 className="text-xl font-semibold text-white mb-4">Implementation</h2>
              <div className="relative mb-8">
                <pre className="bg-navy-lighter rounded-xl p-4 overflow-x-auto text-sm font-mono text-muted-foreground border border-cyan/10">
                  {codeExamples.encryption}
                </pre>
                <button
                  onClick={() => copyToClipboard(codeExamples.encryption, "encryption")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-navy-lighter hover:bg-cyan/10 text-muted-foreground hover:text-cyan transition-colors"
                >
                  {copiedCode === "encryption" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <h2 className="text-xl font-semibold text-white mb-4">Security Features</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span>256-bit key length for maximum security</span>
                </li>
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span>GCM mode with authentication tags</span>
                </li>
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span>Unique IV for each encryption operation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                  <span>Keys stored in secure environment variables</span>
                </li>
              </ul>
            </GlassCard>
          )}

          {/* Database Schema */}
          {activeSection === "database" && (
            <GlassCard variant="strong">
              <h1 className="text-3xl font-bold text-white mb-6">Database Schema</h1>

              <p className="text-muted-foreground mb-6">
                PhishGuard AI uses Firebase Firestore as the primary database for storing email analysis results.
              </p>

              <div className="relative">
                <pre className="bg-navy-lighter rounded-xl p-4 overflow-x-auto text-sm font-mono text-muted-foreground border border-cyan/10">
                  {codeExamples.database}
                </pre>
                <button
                  onClick={() => copyToClipboard(codeExamples.database, "database")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-navy-lighter hover:bg-cyan/10 text-muted-foreground hover:text-cyan transition-colors"
                >
                  {copiedCode === "database" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </GlassCard>
          )}

          {/* FAQ */}
          {activeSection === "faq" && (
            <GlassCard variant="strong">
              <h1 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h1>

              <div className="space-y-6">
                {[
                  {
                    q: "How accurate is the phishing detection?",
                    a: "Our DistilBERT model achieves 99.7% accuracy on standard phishing datasets. However, we recommend reviewing flagged emails manually for critical decisions.",
                  },
                  {
                    q: "Is my email data stored?",
                    a: "We store encrypted metadata and analysis results. Full email content is processed in memory and not persisted. All sensitive data is encrypted with AES-256.",
                  },
                  {
                    q: "Can I use PhishGuard AI with other email providers?",
                    a: "Currently, we support Gmail via OAuth 2.0. Support for Outlook and other providers is planned for future releases.",
                  },
                  {
                    q: "How do I integrate with my existing security stack?",
                    a: "PhishGuard AI provides REST APIs and webhooks for integration. See our API documentation for details.",
                  },
                ].map((faq, i) => (
                  <div key={i} className="p-4 bg-navy-lighter/50 rounded-xl border border-cyan/10">
                    <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm">{faq.a}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Placeholder for other sections */}
          {!["introduction", "api", "encryption", "database", "faq"].includes(activeSection) && (
            <GlassCard variant="strong">
              <h1 className="text-3xl font-bold text-white mb-6">
                {sections.find((s) => s.id === activeSection)?.label}
              </h1>
              <p className="text-muted-foreground">Documentation content for this section coming soon.</p>
            </GlassCard>
          )}
        </div>

        {/* Table of contents (right sidebar) */}
        <aside className="hidden xl:block w-48 flex-shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">On this page</p>
            <nav className="space-y-2 text-sm">
              <a href="#" className="block text-cyan">
                Overview
              </a>
              <a href="#" className="block text-muted-foreground hover:text-white transition-colors">
                Getting Started
              </a>
              <a href="#" className="block text-muted-foreground hover:text-white transition-colors">
                Configuration
              </a>
              <a href="#" className="block text-muted-foreground hover:text-white transition-colors">
                Examples
              </a>
            </nav>
          </div>
        </aside>
      </div>
    </div>
  )
}
