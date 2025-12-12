import { GlassCard } from "@/components/ui/glass-card"

export function ArchitectureSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">System Architecture</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A robust, scalable architecture designed for security and performance
          </p>
        </div>

        <GlassCard variant="strong" className="p-8 overflow-hidden">
          {/* Architecture diagram */}
          <div className="relative">
            <svg viewBox="0 0 1000 400" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
              {/* Define gradients and filters */}
              <defs>
                <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#27F3D6" />
                  <stop offset="100%" stopColor="#3A86FF" />
                </linearGradient>
                <filter id="glowFilter">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connection lines */}
              <path
                d="M150 200 L280 200"
                stroke="url(#cyanGradient)"
                strokeWidth="2"
                filter="url(#glowFilter)"
                strokeDasharray="5,5"
              >
                <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
              </path>
              <path
                d="M380 200 L510 200"
                stroke="url(#cyanGradient)"
                strokeWidth="2"
                filter="url(#glowFilter)"
                strokeDasharray="5,5"
              >
                <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
              </path>
              <path
                d="M610 200 L740 200"
                stroke="url(#cyanGradient)"
                strokeWidth="2"
                filter="url(#glowFilter)"
                strokeDasharray="5,5"
              >
                <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
              </path>
              <path
                d="M840 200 L950 200"
                stroke="url(#cyanGradient)"
                strokeWidth="2"
                filter="url(#glowFilter)"
                strokeDasharray="5,5"
              >
                <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
              </path>

              {/* Gmail Box */}
              <g transform="translate(50, 140)">
                <rect width="100" height="120" rx="12" fill="rgba(26, 35, 64, 0.8)" stroke="#27F3D6" strokeWidth="1" />
                <text x="50" y="50" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="600">
                  Gmail
                </text>
                <text x="50" y="70" fill="rgba(234, 246, 255, 0.6)" fontSize="10" textAnchor="middle">
                  Email Source
                </text>
                <circle cx="50" cy="95" r="15" fill="rgba(39, 243, 214, 0.2)" />
                <text x="50" y="100" fill="#27F3D6" fontSize="16" textAnchor="middle">
                  ✉
                </text>
              </g>

              {/* n8n Box */}
              <g transform="translate(280, 140)">
                <rect width="100" height="120" rx="12" fill="rgba(26, 35, 64, 0.8)" stroke="#3A86FF" strokeWidth="1" />
                <text x="50" y="50" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="600">
                  n8n
                </text>
                <text x="50" y="70" fill="rgba(234, 246, 255, 0.6)" fontSize="10" textAnchor="middle">
                  Automation
                </text>
                <circle cx="50" cy="95" r="15" fill="rgba(58, 134, 255, 0.2)" />
                <text x="50" y="100" fill="#3A86FF" fontSize="16" textAnchor="middle">
                  ⚡
                </text>
              </g>

              {/* AI Engine Box */}
              <g transform="translate(510, 140)">
                <rect width="100" height="120" rx="12" fill="rgba(26, 35, 64, 0.8)" stroke="#27F3D6" strokeWidth="1" />
                <text x="50" y="50" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="600">
                  AI Engine
                </text>
                <text x="50" y="70" fill="rgba(234, 246, 255, 0.6)" fontSize="10" textAnchor="middle">
                  ML Classification
                </text>
                <circle cx="50" cy="95" r="15" fill="rgba(39, 243, 214, 0.2)" />
                <text x="50" y="100" fill="#27F3D6" fontSize="16" textAnchor="middle">
                  🧠
                </text>
              </g>

              {/* Firebase Box */}
              <g transform="translate(740, 140)">
                <rect width="100" height="120" rx="12" fill="rgba(26, 35, 64, 0.8)" stroke="#3A86FF" strokeWidth="1" />
                <text x="50" y="50" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="600">
                  Firebase
                </text>
                <text x="50" y="70" fill="rgba(234, 246, 255, 0.6)" fontSize="10" textAnchor="middle">
                  Cloud Storage
                </text>
                <circle cx="50" cy="95" r="15" fill="rgba(58, 134, 255, 0.2)" />
                <text x="50" y="100" fill="#3A86FF" fontSize="16" textAnchor="middle">
                  ☁
                </text>
              </g>

              {/* Encryption indicator */}
              <g transform="translate(610, 270)">
                <rect
                  width="130"
                  height="40"
                  rx="8"
                  fill="rgba(39, 243, 214, 0.1)"
                  stroke="rgba(39, 243, 214, 0.3)"
                  strokeWidth="1"
                />
                <text x="65" y="25" fill="#27F3D6" fontSize="10" textAnchor="middle">
                  🔒 AES-256 Encrypted
                </text>
              </g>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-cyan/20">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan" />
              <span className="text-sm text-muted-foreground">Data Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue" />
              <span className="text-sm text-muted-foreground">Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-risk-low" />
              <span className="text-sm text-muted-foreground">Encrypted</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}
