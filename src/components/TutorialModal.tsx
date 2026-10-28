import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Building2,
  Users,
  Zap,
  FileText,
  Sparkles,
  Tag,
  QrCode,
  Rocket,
} from 'lucide-react';
import type { AppTheme } from '../types';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemo?: () => void;
  theme: AppTheme;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onLoadDemo,
  theme,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const isPurple = theme === 'purple';

  if (!isOpen) return null;

  // ─── Step definitions ─────────────────────────────────────────────────────

  const STEPS = [
    // ── Step 1 ── Welcome
    {
      badge: 'Step 1 of 8 • The Concept',
      title: 'Welcome to KharchaSplit 🏠',
      subtitle: 'Your smart flatmate & hostel expense ledger — made for Indian shared living.',
      icon: <Building2 className="w-8 h-8 text-rose-500" />,
      iconBg: isPurple
        ? 'bg-purple-500/15 border-purple-500/30'
        : 'bg-rose-500/15 border-rose-500/30',
      points: [
        {
          emoji: '🤯',
          title: 'The Flatmate Problem',
          desc: 'Wi-Fi bills, maid salary, Zepto groceries, LPG cylinder — who paid what? Who owes how much? It gets messy and confusing fast.',
        },
        {
          emoji: '⚖️',
          title: 'Zero Maths, Zero Awkward Chats',
          desc: 'KharchaSplit tracks every expense and tells you exactly who owes ₹ to whom. No manual calculator math. No awkward WhatsApp reminders.',
        },
        {
          emoji: '📱',
          title: 'Works Instantly on Any Phone',
          desc: 'Open the link in any mobile browser. It works offline too. Tap "Install" on your browser menu to add it like a native app.',
        },
      ],
      example: null,
    },

    // ── Step 2 ── Add Flatmates
    {
      badge: 'Step 2 of 8 • Flatmates',
      title: 'Add Your Flatmates 👥',
      subtitle: 'Start by adding everyone living in the flat. You only need their Name and UPI ID.',
      icon: <Users className="w-8 h-8 text-amber-400" />,
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      points: [
        {
          emoji: '🔤',
          title: 'Name & Color Avatar',
          desc: 'First names work great — Aman, Rohit, Priya, Kavya. Each person gets a distinct color badge.',
        },
        {
          emoji: '💳',
          title: 'UPI ID (find it in GPay / PhonePe)',
          desc: 'Open Google Pay or PhonePe → tap your profile photo → "UPI IDs". It looks like aman@okaxis or 9876543210@ybl. Needed for 1-tap payments.',
        },
        {
          emoji: '📞',
          title: 'Phone Number (Optional)',
          desc: 'Enter mobile number if you want to send automatic WhatsApp payment receipts upon settlement.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/10 overflow-hidden text-xs font-mono">
          <div className="px-3.5 py-2 bg-white/5 text-zinc-300 text-xs uppercase tracking-wider font-sans font-bold">
            Example Flat Roster — #KORA-402
          </div>
          {[
            { color: '#ff003b', name: 'Aman', upi: 'aman@okaxis' },
            { color: '#f59e0b', name: 'Rohit', upi: 'rohit@ybl' },
            { color: '#8b5cf6', name: 'Priya', upi: 'priya@paytm' },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-white/5 last:border-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow"
                style={{ backgroundColor: m.color }}
              >
                {m.name[0]}
              </div>
              <span className="text-white font-sans font-semibold text-sm">{m.name}</span>
              <span className="text-zinc-300 ml-auto font-mono text-xs">{m.upi}</span>
              <span className="text-emerald-400 font-bold ml-1">✓</span>
            </div>
          ))}
        </div>
      ),
    },

    // ── Step 3 ── Log an Expense
    {
      badge: 'Step 3 of 8 • Expenses',
      title: 'Log a Shared Expense 💸',
      subtitle: 'Someone paid for milk, water, or dinner? Log it in just 20 seconds.',
      icon: <FileText className="w-8 h-8 text-sky-400" />,
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      points: [
        {
          emoji: '📝',
          title: 'Title & Amount',
          desc: 'Enter what it was (e.g., "Zepto Grocery Run") and the total bill amount (e.g., ₹840).',
        },
        {
          emoji: '🙋',
          title: 'Who Paid?',
          desc: 'Select the roommate who paid the bill. Their positive credit balance is automatically updated.',
        },
        {
          emoji: '➕',
          title: 'Quick 1-Tap Access',
          desc: 'Look for the bright "+ Add Expense" button in the top header on both mobile and desktop.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2 bg-white/5 text-zinc-300 text-xs uppercase tracking-wider font-bold">
            Live Expense Card Preview
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-300 font-medium">Title</span>
              <span className="text-white font-bold text-sm">Zepto Grocery Run</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300 font-medium">Total Bill</span>
              <span className="text-emerald-400 font-extrabold text-base">₹840</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300 font-medium">Paid by</span>
              <span className="text-white font-semibold">🟡 Aman</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300 font-medium">Category Tag</span>
              <span className="text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">🛒 Zepto / Blinkit</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300 font-medium">Split Rule</span>
              <span className="text-white">Split Equally (3 people)</span>
            </div>
            <div className="pt-2 mt-1 border-t border-white/10 text-center text-zinc-300 text-xs">
              Each flatmate owes&nbsp;
              <span className="text-amber-400 font-extrabold text-sm">₹280</span>
            </div>
          </div>
        </div>
      ),
    },

    // ── Step 4 ── Equal vs Custom Split
    {
      badge: 'Step 4 of 8 • Splitting',
      title: 'Equal vs Custom Split ⚖️',
      subtitle: 'Different consumption? Custom splits let you adjust exact rupee shares.',
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      iconBg: 'bg-yellow-500/15 border-yellow-500/30',
      points: [
        {
          emoji: '🟢',
          title: 'Equal Split (Default)',
          desc: 'Divides the bill evenly. Rounding odd paise is handled automatically so total balances always match.',
        },
        {
          emoji: '🎛️',
          title: 'Custom Split',
          desc: 'Enter an exact rupee amount per person. Ideal when someone ordered beer or skipped eating.',
        },
        {
          emoji: '📋',
          title: 'Itemized Notes Per Person',
          desc: 'Add custom notes per roommate (e.g., "ordered chicken", "skipped dessert") to keep full transparency.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/10 overflow-hidden text-xs">
          <div className="grid grid-cols-2 divide-x divide-white/10">
            <div>
              <div className="px-3 py-2 bg-emerald-500/15 text-emerald-300 text-xs uppercase tracking-wider text-center font-bold">
                Equal Split
              </div>
              <div className="px-3.5 py-2.5 space-y-1.5">
                {[['Aman', '₹280'], ['Rohit', '₹280'], ['Priya', '₹280']].map(([n, a]) => (
                  <div key={n} className="flex justify-between">
                    <span className="text-zinc-300">{n}</span>
                    <span className="text-white font-semibold">{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="px-3 py-2 bg-amber-500/15 text-amber-300 text-xs uppercase tracking-wider text-center font-bold">
                Custom Split
              </div>
              <div className="px-3.5 py-2.5 space-y-1.5">
                {[['Aman', '₹400'], ['Rohit', '₹240'], ['Priya', '₹200']].map(([n, a]) => (
                  <div key={n} className="flex justify-between">
                    <span className="text-zinc-300">{n}</span>
                    <span className="text-white font-semibold">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-3 py-2 border-t border-white/10 text-center text-zinc-300 text-xs font-medium">
            Both total ₹840 • Perfectly verified math
          </div>
        </div>
      ),
    },

    // ── Step 5 ── Tags
    {
      badge: 'Step 5 of 8 • Categories',
      title: 'Category Tags & Spending Chart 🏷️',
      subtitle: 'See where your flat money goes every month with visual analytics.',
      icon: <Tag className="w-8 h-8 text-pink-400" />,
      iconBg: 'bg-pink-500/15 border-pink-500/30',
      points: [
        {
          emoji: '🏠',
          title: 'Indian Household Presets',
          desc: 'Maid Salary 🧹 • Cook 👨‍🍳 • Wi-Fi Bill 📶 • Zepto/Blinkit 🛒 • Electricity ⚡ • Rent 🏠 • Water Can 💧 • LPG Cylinder 🔥 • Swiggy 🍔',
        },
        {
          emoji: '➕',
          title: 'Create Your Own Custom Tags',
          desc: 'Tap "+ New Tag" to create custom tags like "OTT Subscription 🎬", "Gym 🏋️", or "Drinking Water 💧".',
        },
        {
          emoji: '📊',
          title: 'Visual Spending Breakdown',
          desc: 'A real-time bar chart on your home screen tracks category percentages and total group burn rate.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2 bg-white/5 text-zinc-300 text-xs uppercase tracking-wider font-bold">
            Monthly Spending Breakdown
          </div>
          <div className="p-3 space-y-2.5">
            {[
              { tag: '🏠 Rent', amt: '₹12,000', pct: 62, color: 'bg-rose-500' },
              { tag: '🧹 Maid Salary', amt: '₹3,500', pct: 18, color: 'bg-amber-400' },
              { tag: '📶 Wi-Fi Bill', amt: '₹1,499', pct: 8, color: 'bg-sky-400' },
              { tag: '🛒 Zepto/Blinkit', amt: '₹2,300', pct: 12, color: 'bg-emerald-400' },
            ].map(({ tag, amt, pct, color }) => (
              <div key={tag} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">{tag}</span>
                  <span className="text-zinc-200 font-bold">{amt}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── Step 6 ── Settlements
    {
      badge: 'Step 6 of 8 • Debt Minimization',
      title: 'Who Owes Whom (Minimized Debt) 🧾',
      subtitle: 'No complex webs of debt. The algorithm minimizes transactions into direct payments.',
      icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      points: [
        {
          emoji: '🤖',
          title: 'Greedy Min-Cash Flow Algorithm',
          desc: 'Instead of 10 confusing cross-payments between roommates, the math collapses them into just 1–2 direct payments.',
        },
        {
          emoji: '🟢',
          title: 'Green Cards = Money Coming to You',
          desc: 'Shows who owes you money with their UPI details ready for requesting payment.',
        },
        {
          emoji: '🔴',
          title: 'Red Cards = You Owe Someone',
          desc: 'Shows the receiver and exact amount. Tap "Pay via UPI App" to settle up immediately.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2 bg-white/5 text-zinc-300 text-xs uppercase tracking-wider font-bold">
            Settlement Summary Example
          </div>
          <div className="p-3 space-y-2">
            <div className="rounded-lg bg-rose-500/15 border border-rose-500/30 p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-bold text-sm">Rohit → Aman</div>
                <div className="text-zinc-300 text-xs">Settling grocery share</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-black text-base">₹280</span>
                <span className="text-xs bg-rose-500 text-white font-bold px-2 py-1 rounded shadow">Pay UPI →</span>
              </div>
            </div>
            <div className="rounded-lg bg-rose-500/15 border border-rose-500/30 p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-bold text-sm">Priya → Aman</div>
                <div className="text-zinc-300 text-xs">Wi-Fi + Zepto share</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-black text-base">₹780</span>
                <span className="text-xs bg-rose-500 text-white font-bold px-2 py-1 rounded shadow">Pay UPI →</span>
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 border-t border-white/10 text-center text-zinc-300 text-xs font-medium">
            3 roommates • 6 mixed bills ➔ only 2 direct payments needed
          </div>
        </div>
      ),
    },

    // ── Step 7 ── UPI / QR
    {
      badge: 'Step 7 of 8 • 1-Click Payments',
      title: 'Pay via UPI or In-Browser QR 📱',
      subtitle: 'One tap opens GPay, PhonePe, or Paytm with the exact rupee amount pre-filled.',
      icon: <QrCode className="w-8 h-8 text-violet-400" />,
      iconBg: 'bg-violet-500/15 border-violet-500/30',
      points: [
        {
          emoji: '📲',
          title: 'On Mobile: 1-Tap UPI Intent',
          desc: 'Tap "Pay via UPI App" → your phone opens GPay / PhonePe / Paytm with the recipient and ₹ amount already pre-filled. Just enter your UPI PIN.',
        },
        {
          emoji: '🖥️',
          title: 'On Laptop/Desktop: Scan QR Code',
          desc: 'Tap "Show QR" → an instant crisp QR code renders on your screen. Scan it with any phone camera to pay immediately.',
        },
        {
          emoji: '🎉',
          title: 'Mark as Paid & WhatsApp Receipt',
          desc: 'After payment, tap "Mark Paid". You can send an auto-composed WhatsApp receipt to the receiver and enjoy celebration confetti!',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2 bg-white/5 text-zinc-300 text-xs uppercase tracking-wider font-bold">
            How UPI Intent Works
          </div>
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-xs shrink-0 font-bold border border-violet-500/30">1</span>
              <span className="text-zinc-200">App generates NPCI link: <code className="text-violet-300 font-mono text-xs bg-violet-950/60 border border-violet-500/30 px-1 py-0.5 rounded">upi://pay?pa=aman@okaxis&am=280</code></span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-xs shrink-0 font-bold border border-violet-500/30">2</span>
              <span className="text-zinc-200">Your phone opens GPay / PhonePe with Aman's name & exact ₹280 ready.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs shrink-0 font-bold border border-emerald-500/30">3</span>
              <span className="text-zinc-200">Enter UPI PIN → payment complete without typing any UPI ID or amount manually.</span>
            </div>
          </div>
        </div>
      ),
    },

    // ── Step 8 ── Flat Rooms + CTA
    {
      badge: 'Step 8 of 8 • Ready',
      title: "You're All Set! 🚀",
      subtitle: 'Explore with full sample data or start fresh with your real flatmates.',
      icon: <Rocket className="w-8 h-8 text-teal-400" />,
      iconBg: 'bg-teal-500/15 border-teal-500/30',
      points: [
        {
          emoji: '🏠',
          title: 'Multiplayer Flat Rooms',
          desc: 'Create a shared room (e.g. #KORA-402) and send the invite link. Any expense added by one person syncs instantly to all flatmates in real-time.',
        },
        {
          emoji: '🔄',
          title: 'Recurring Monthly Bills',
          desc: 'Schedule recurring rent, cook, and maid expenses once. KharchaSplit reminds you and logs them automatically.',
        },
        {
          emoji: '📄',
          title: '1-Click PDF & WhatsApp Reports',
          desc: 'Generate clean multi-page ledger PDFs and copy month-end WhatsApp summaries for your flat chat.',
        },
      ],
      example: null,
      isCta: true,
    },
  ] as const;

  const handleFinish = () => {
    try {
      localStorage.setItem('kharchasplit_tutorial_seen', 'v2');
    } catch {
      // ignore
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const isLast = currentStep === STEPS.length - 1;

  const current = STEPS[currentStep] as (typeof STEPS)[number] & { isCta?: boolean; example?: React.ReactNode | null };
  const totalSteps = STEPS.length;
  const progressPct = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-[#0e0e13] border border-white/15 shadow-2xl relative overflow-hidden flex flex-col max-h-[92dvh]">

        {/* Full-width progress bar (top edge) */}
        <div className="h-1.5 bg-white/10 rounded-t-3xl overflow-hidden shrink-0">
          <div
            className={`h-full transition-all duration-300 ${isPurple ? 'bg-purple-500' : 'bg-rose-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex flex-col p-6 sm:p-7 space-y-4 min-h-0">

          {/* Header row: badge + skip */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{current.badge}</span>
            </span>
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 px-2.5 py-1 rounded-lg"
            >
              <span>Skip Tour</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Icon + title */}
          <div className="flex items-start gap-3.5 shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg shrink-0 ${current.iconBg}`}>
              {current.icon}
            </div>
            <div className="space-y-1 pt-0.5 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading leading-tight tracking-tight">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                {current.subtitle}
              </p>
            </div>
          </div>

          {/* Bullet points */}
          <div className="space-y-2.5 shrink-0">
            {current.points.map((pt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start gap-3 shadow-sm"
              >
                <span className="text-xl shrink-0 leading-none mt-0.5">{pt.emoji}</span>
                <div className="space-y-1 text-left min-w-0">
                  <div className="text-sm font-bold text-white tracking-tight">{pt.title}</div>
                  <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">{pt.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Example card (when present) */}
          {current.example != null && (
            <div className="shrink-0 mt-1">
              {current.example}
            </div>
          )}

          {/* CTA buttons for last step */}
          {current.isCta && (
            <div className="space-y-2.5 shrink-0 pt-2">
              {onLoadDemo && (
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.setItem('kharchasplit_tutorial_seen', 'v2'); } catch { /* ignore */ }
                    onLoadDemo();
                  }}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2 ${
                    isPurple
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/60'
                      : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load Demo Data — Explore First</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 rounded-2xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-zinc-200 transition-all cursor-pointer"
              >
                Start Fresh with My Real Flatmates
              </button>
            </div>
          )}
        </div>

        {/* Sticky footer: dots + nav */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0 bg-[#0e0e13]">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? isPurple
                      ? 'w-6 bg-purple-400'
                      : 'w-6 bg-rose-500'
                    : 'w-2 bg-zinc-600 hover:bg-zinc-400'
                }`}
                title={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2.5">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {!isLast && (
              <button
                type="button"
                onClick={handleNext}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
                  isPurple
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/60'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/60'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
