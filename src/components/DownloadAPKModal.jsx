import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Smartphone, ShieldCheck, WifiOff, CheckCircle2, Copy, Terminal } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'

const APK_URL = '/downloads/sokofresh.apk'

export default function DownloadAPKModal({ open, onClose }) {
  const { showToast } = useApp()
  const [copied, setCopied] = useState(false)

  const copyCmd = async (cmd) => {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopied(cmd)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      showToast('Copy failed — select the text manually', 'error')
    }
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = APK_URL
    a.download = 'sokofresh.apk'
    document.body.appendChild(a)
    a.click()
    a.remove()
    showToast('APK download started — allow installs from this source if prompted', 'success')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-strong glass-glow w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg,#10b981,#a3e635)' }}>
                    🌱
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg leading-tight">SokoFresh for Android</h3>
                    <p className="text-xs text-secondary-sf">v1.0.0 · Android 5.1+ (minSdk 22)</p>
                  </div>
                </div>
                <button onClick={onClose} className="btn-ghost !p-2 !rounded-xl" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { icon: WifiOff, label: 'Works offline' },
                  { icon: ShieldCheck, label: 'CI-built binary' },
                  { icon: Smartphone, label: 'One-tap install' },
                ].map((f) => (
                  <div key={f.label} className="glass rounded-xl p-3 text-center">
                    <f.icon size={18} className="mx-auto mb-1.5 text-accent-sf" />
                    <p className="text-[0.65rem] font-semibold text-secondary-sf leading-tight">{f.label}</p>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
                className="btn-primary w-full justify-center !py-3.5 !text-base !rounded-2xl mb-3"
              >
                <Download size={20} /> Download Android APK
              </motion.button>
              <p className="text-[0.7rem] text-center text-muted-sf mb-6">
                Direct link: <span className="font-mono">/downloads/sokofresh.apk</span> — built and re-published by CI on every push, served by Vercel.
              </p>

              <div className="glass rounded-2xl p-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-secondary-sf mb-3 flex items-center gap-2">
                  <Terminal size={13} /> Build your own signed APK
                </p>
                {[
                  'npm run cap:build',
                  'npx cap open android',
                  'cd android && ./gradlew assembleRelease',
                ].map((cmd) => (
                  <div key={cmd} className="flex items-center gap-2 mb-2 last:mb-0">
                    <code className="flex-1 text-[0.7rem] font-mono px-3 py-2 rounded-lg truncate" style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border-soft)' }}>
                      {cmd}
                    </code>
                    <button onClick={() => copyCmd(cmd)} className="btn-ghost !p-2 !rounded-lg" aria-label="Copy command">
                      {copied === cmd ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
                <p className="text-[0.7rem] text-muted-sf mt-3 leading-relaxed">
                  Capacitor wraps the Vite build (<span className="font-mono">dist/</span>) into a native WebView.
                  The APK stores all data in IndexedDB — no server needed in the field.
                </p>
              </div>

              <div className="flex items-start gap-2 text-[0.7rem] text-muted-sf leading-relaxed">
                <ShieldCheck size={14} className="shrink-0 mt-0.5 text-accent-sf" />
                <span>
                  If Android asks to allow installs from your browser, tap <strong>Allow</strong> — SokoFresh is a
                  first-party logistics tool, not from the Play Store. Uninstall any previous build first if upgrading.
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
