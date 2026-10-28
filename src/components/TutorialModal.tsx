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
      badge: 'Step 1 of 8',
      title: 'Welcome to KharchaSplit 🏠',
      subtitle: 'Your smart flatmate & hostel expense ledger — made for India.',
      icon: <Building2 className="w-8 h-8 text-rose-500" />,
      iconBg: isPurple
        ? 'bg-purple-500/10 border-purple-500/30'
        : 'bg-rose-500/10 border-rose-500/30',
      points: [
        {
          emoji: '🤯',
          title: 'The Flatmate Problem',
          desc: 'Wi-Fi bill, maid salary, Zepto groceries, LPG cylinder — who paid what? Who owes how much? It gets messy fast.',
        },
        {
          emoji: '⚖️',
          title: 'Zero Maths, Zero Awkward Chats',
          desc: 'KharchaSplit tracks every expense and tells you exactly who owes ₹ to whom. No calculator. No WhatsApp arguments.',
        },
        {
          emoji: '📱',
          title: 'Works on Phone, No App Install',
          desc: 'Open in your browser and it works immediately. Works offline too. Tap "Install" on the share menu to pin it to your home screen.',
        },
      ],
      example: null,
    },

    // ── Step 2 ── Add Flatmates
    {
      badge: 'Step 2 of 8',
      title: 'Add Your Flatmates 👥',
      subtitle: 'Start by adding everyone who lives with you. You only need their name and UPI ID.',
      icon: <Users className="w-8 h-8 text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      points: [
        {
          emoji: '🔤',
          title: 'Name',
          desc: 'First names work great — Aman, Rohit, Priya, Kavya. Each person gets a unique colour avatar.',
        },
        {
          emoji: '💳',
          title: 'UPI ID (find it in GPay / PhonePe)',
          desc: 'Open GPay → tap your photo → "UPI IDs". It looks like aman@okaxis or 9876543210@ybl. It\'s needed to generate a 1-tap payment link.',
        },
        {
          emoji: '📞',
          title: 'Phone Number (optional)',
          desc: 'Only needed if you want to send a WhatsApp settlement receipt to that person after they pay.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/8 overflow-hidden text-[11px] font-mono">
          <div className="px-3 py-1.5 bg-white/5 text-zinc-500 text-[10px] uppercase tracking-wider font-sans">
            Example — Flat: KORA-402
          </div>
          {[
            { color: '#ff003b', name: 'Aman', upi: 'aman@okaxis' },
            { color: '#f59e0b', name: 'Rohit', upi: 'rohit@ybl' },
            { color: '#8b5cf6', name: 'Priya', upi: 'priya@paytm' },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-2.5 px-3 py-2 border-b border-white/5 last:border-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: m.color }}
              >
                {m.name[0]}
              </div>
              <span className="text-white font-sans font-semibold">{m.name}</span>
              <span className="text-zinc-500 ml-auto">{m.upi}</span>
              <span className="text-emerald-400">✓</span>
            </div>
          ))}
        </div>
      ),
    },

    // ── Step 3 ── Log an Expense
    {
      badge: 'Step 3 of 8',
      title: 'Log a Shared Expense 💸',
      subtitle: 'Someone paid for groceries? Log it in 20 seconds.',
      icon: <FileText className="w-8 h-8 text-sky-400" />,
      iconBg: 'bg-sky-500/10 border-sky-500/30',
      points: [
        {
          emoji: '📝',
          title: 'Title + Amount',
          desc: 'Write what it was (e.g. "Zepto Grocery Run") and the full bill amount (e.g. ₹840).',
        },
        {
          emoji: '🙋',
          title: 'Who Paid?',
          desc: 'Select the person who physically paid the bill. Their balance will be adjusted automatically.',
        },
        {
          emoji: '➕',
          title: 'Where is the button?',
          desc: 'Look for the blue "+ Add Expense" button in the top header bar of the app.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/8 overflow-hidden text-[11px]">
          <div className="px-3 py-1.5 bg-white/5 text-zinc-500 text-[10px] uppercase tracking-wider">
            Example Expense
          </div>
          <div className="px-3 py-2.5 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Title</span>
              <span className="text-white font-semibold">Zepto Grocery Run</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Amount</span>
              <span className="text-emerald-400 font-bold">₹840</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Paid by</span>
              <span className="text-white">🟡 Aman</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Tag</span>
              <span className="text-white">🛒 Zepto / Blinkit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Split</span>
              <span className="text-white">Equal — 3 people</span>
            </div>
            <div className="pt-1 mt-1 border-t border-white/8 text-center text-zinc-500">
              Each person owes&nbsp;
              <span className="text-amber-400 font-bold">₹280</span>
            </div>
          </div>
        </div>
      ),
    },

    // ── Step 4 ── Equal vs Custom Split
    {
      badge: 'Step 4 of 8',
      title: 'Equal vs Custom Split ⚖️',
      subtitle: 'Not everyone ordered the same? Custom splits handle that.',
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      iconBg: 'bg-yellow-500/10 border-yellow-500/30',
      points: [
        {
          emoji: '🟢',
          title: 'Equal Split (default)',
          desc: 'Divides the total evenly across all or selected flatmates. Rounding is handled automatically — no penny gets lost.',
        },
        {
          emoji: '🎛️',
          title: 'Custom Split',
          desc: 'Enter a specific rupee amount per person. Perfect when someone skipped a meal, ordered extra, or a bill has different consumptions.',
        },
        {
          emoji: '📋',
          title: 'Per-person notes',
          desc: 'In Custom mode you can add a note per person — e.g. "Ordered 2 beers" or "Skipped dessert" — so everyone knows why.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/8 overflow-hidden text-[11px]">
          <div className="grid grid-cols-2 divide-x divide-white/8">
            <div>
              <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider text-center">
                Equal Split
              </div>
              <div className="px-3 py-2 space-y-1">
                {[['Aman', '₹280'], ['Rohit', '₹280'], ['Priya', '₹280']].map(([n, a]) => (
                  <div key={n} className="flex justify-between">
                    <span className="text-zinc-400">{n}</span>
                    <span className="text-white">{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-[10px] uppercase tracking-wider text-center">
                Custom Split
              </div>
              <div className="px-3 py-2 space-y-1">
                {[['Aman', '₹400'], ['Rohit', '₹240'], ['Priya', '₹200']].map(([n, a]) => (
                  <div key={n} className="flex justify-between">
                    <span className="text-zinc-400">{n}</span>
                    <span className="text-white">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 border-t border-white/8 text-center text-zinc-500 text-[10px]">
            Both total ₹840 · Rounding handled automatically
          </div>
        </div>
      ),
    },

    // ── Step 5 ── Tags
    {
      badge: 'Step 5 of 8',
      title: 'Category Tags 🏷️',
      subtitle: 'Tags help you see where your flat money goes each month.',
      icon: <Tag className="w-8 h-8 text-pink-400" />,
      iconBg: 'bg-pink-500/10 border-pink-500/30',
      points: [
        {
          emoji: '🏠',
          title: 'Pre-loaded Indian household tags',
          desc: 'Maid Salary 🧹  ·  Cook 👨‍🍳  ·  Wi-Fi Bill 📶  ·  Zepto/Blinkit 🛒  ·  Electricity ⚡  ·  Rent 🏠  ·  Water Can 💧  ·  LPG Cylinder 🔥  ·  Swiggy 🍔',
        },
        {
          emoji: '➕',
          title: 'Create your own tag',
          desc: 'Tap "+ New Tag" inside the Add Expense form to create a custom tag like "Parking 🚗" or "OTT Subscription 🎬".',
        },
        {
          emoji: '📊',
          title: 'Spending bar chart',
          desc: 'The main screen shows a colour-coded bar chart so you can see at a glance how much went on groceries vs utilities.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/8 overflow-hidden text-[11px]">
          <div className="px-3 py-1.5 bg-white/5 text-zinc-500 text-[10px] uppercase tracking-wider">
            This month's spending breakdown
          </div>
          {[
            { tag: '🏠 Rent', amt: '₹12,000', pct: 62, color: 'bg-rose-500' },
            { tag: '🧹 Maid Salary', amt: '₹3,500', pct: 18, color: 'bg-amber-400' },
            { tag: '📶 Wi-Fi Bill', amt: '₹1,499', pct: 8, color: 'bg-sky-400' },
            { tag: '🛒 Zepto/Blinkit', amt: '₹2,300', pct: 12, color: 'bg-emerald-400' },
          ].map(({ tag, amt, pct, color }) => (
            <div key={tag} className="px-3 py-2 space-y-1 border-b border-white/5 last:border-0">
              <div className="flex justify-between">
                <span className="text-white">{tag}</span>
                <span className="text-zinc-300 font-semibold">{amt}</span>
              </div>
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },

    // ── Step 6 ── Settlements
    {
      badge: 'Step 6 of 8',
      title: 'Who Owes Whom 🧾',
      subtitle: 'No more mental maths — KharchaSplit finds the minimum number of payments needed.',
      icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      points: [
        {
          emoji: '🤖',
          title: 'Smart Algorithm',
          desc: 'With 4 flatmates, you could have up to 12 cross-payments. The algorithm reduces that to just 2–3 clean transfers.',
        },
        {
          emoji: '🟢',
          title: 'Green card = money coming to you',
          desc: 'Someone owes you money. You\'ll see their name, the amount, and a "Pay via UPI" button they can tap.',
        },
        {
          emoji: '🔴',
          title: 'Red card = you owe someone',
          desc: 'You owe money. Tap "Pay via UPI App" to open GPay/PhonePe with the exact amount pre-filled.',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/8 overflow-hidden text-[11px]">
          <div className="px-3 py-1.5 bg-white/5 text-zinc-500 text-[10px] uppercase tracking-wider">
            Settlement Cards — This Week
          </div>
          <div className="p-2.5 space-y-2">
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 flex items-center gap-2">
              <div className="grow">
                <div className="text-white font-semibold">Rohit → Aman</div>
                <div className="text-zinc-400 text-[10px]">Grocery split</div>
              </div>
              <div className="text-rose-400 font-bold text-sm">₹280</div>
              <div className="text-[10px] text-rose-300 border border-rose-500/30 rounded px-1.5 py-0.5">Pay UPI →</div>
            </div>
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 flex items-center gap-2">
              <div className="grow">
                <div className="text-white font-semibold">Priya → Aman</div>
                <div className="text-zinc-400 text-[10px]">Wi-Fi + Grocery</div>
              </div>
              <div className="text-rose-400 font-bold text-sm">₹780</div>
              <div className="text-[10px] text-rose-300 border border-rose-500/30 rounded px-1.5 py-0.5">Pay UPI →</div>
            </div>
          </div>
          <div className="px-3 py-1.5 border-t border-white/8 text-center text-zinc-500 text-[10px]">
            3 people · 6 expenses → just 2 payments needed ✓
          </div>
        </div>
      ),
    },

    // ── Step 7 ── UPI / QR
    {
      badge: 'Step 7 of 8',
      title: 'Pay via UPI or QR Code 📱',
      subtitle: 'One tap opens GPay or PhonePe with the exact rupee amount already filled in.',
      icon: <QrCode className="w-8 h-8 text-violet-400" />,
      iconBg: 'bg-violet-500/10 border-violet-500/30',
      points: [
        {
          emoji: '📲',
          title: 'On Mobile — 1 tap to pay',
          desc: 'Tap "Pay via UPI App" → your phone opens GPay / PhonePe / Paytm with the UPI ID and ₹ amount already filled. Just hit Confirm.',
        },
        {
          emoji: '🖥️',
          title: 'On Desktop / Laptop — scan the QR',
          desc: 'Tap "Show QR Code" → a high-res QR code is generated on screen. Scan it with your phone camera and pay directly.',
        },
        {
          emoji: '🎉',
          title: 'Mark Paid + WhatsApp Receipt',
          desc: 'After paying, tap "Mark as Paid". You can optionally auto-send a WhatsApp receipt to the receiver. Confetti plays on settlement!',
        },
      ],
      example: (
        <div className="rounded-xl bg-zinc-950 border border-white/8 overflow-hidden text-[11px]">
          <div className="px-3 py-1.5 bg-white/5 text-zinc-500 text-[10px] uppercase tracking-wider">
            What happens when you tap "Pay via UPI App"
          </div>
          <div className="p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
              <span className="text-zinc-300">App generates link: <code className="text-violet-300">upi://pay?pa=aman@okaxis&am=280</code></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
              <span className="text-zinc-300">Your phone opens GPay / PhonePe with Aman's name & ₹280 pre-filled</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
              <span className="text-zinc-300">You confirm → done. No need to type anything manually.</span>
            </div>
          </div>
        </div>
      ),
    },

    // ── Step 8 ── Flat Rooms + CTA
    {
      badge: 'Step 8 of 8',
      title: "You're All Set! 🚀",
      subtitle: 'Explore with demo data or start fresh with your real flatmates.',
      icon: <Rocket className="w-8 h-8 text-teal-400" />,
      iconBg: 'bg-teal-500/10 border-teal-500/30',
      points: [
        {
          emoji: '🏠',
          title: 'Create a Flat Room (optional)',
          desc: 'Tap the "Rooms" icon in the header to create a shared room like #KORA-402. Share the invite link — your flatmates join and all expenses sync in real-time across everyone\'s phones.',
        },
        {
          emoji: '🔄',
          title: 'Recurring Bills',
          desc: 'Set monthly expenses (rent, maid salary) once. KharchaSplit reminds you and re-adds them automatically each month.',
        },
        {
          emoji: '📄',
          title: 'Reports & Export',
          desc: 'Tap "Report" in the header to export a PDF of the full ledger or share a formatted WhatsApp summary to your flat group.',
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
      <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[95dvh]">

        {/* Full-width progress bar (top edge) */}
        <div className="h-1 bg-white/5 rounded-t-3xl overflow-hidden shrink-0">
          <div
            className={`h-full transition-all duration-300 ${isPurple ? 'bg-purple-500' : 'bg-rose-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Glow accent */}
        <div
          className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-15 ${
            isPurple ? 'bg-purple-500' : 'bg-rose-500'
          }`}
        />

        {/* Scrollable body */}
        <div className="overflow-y-auto flex flex-col p-5 sm:p-6 space-y-4 min-h-0">

          {/* Header row: badge + skip */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-white/5 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{current.badge}</span>
            </span>
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Skip Tour</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Icon + title */}
          <div className="flex items-start gap-3 shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg shrink-0 ${current.iconBg}`}>
              {current.icon}
            </div>
            <div className="space-y-0.5 pt-0.5">
              <h2 className="text-lg sm:text-xl font-black text-white font-heading leading-snug">
                {current.title}
              </h2>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {current.subtitle}
              </p>
            </div>
          </div>

          {/* Bullet points */}
          <div className="space-y-2 shrink-0">
            {current.points.map((pt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-start gap-2.5"
              >
                <span className="text-base shrink-0 leading-none mt-0.5">{pt.emoji}</span>
                <div className="space-y-0.5 text-left min-w-0">
                  <div className="text-[11px] font-bold text-white">{pt.title}</div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed">{pt.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Example card (when present) */}
          {current.example != null && (
            <div className="shrink-0">
              {current.example}
            </div>
          )}

          {/* CTA buttons for last step */}
          {current.isCta && (
            <div className="space-y-2 shrink-0">
              {onLoadDemo && (
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.setItem('kharchasplit_tutorial_seen', 'v2'); } catch { /* ignore */ }
                    onLoadDemo();
                  }}
                  className={`w-full py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
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
                className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-white/8 text-zinc-300 transition-all cursor-pointer"
              >
                Start Fresh with My Real Flatmates
              </button>
            </div>
          )}
        </div>

        {/* Sticky footer: dots + nav */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-white/5 flex items-center justify-between gap-3 shrink-0 bg-zinc-950">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? isPurple
                      ? 'w-5 bg-purple-400'
                      : 'w-5 bg-rose-500'
                    : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
                title={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {!isLast && (
              <button
                type="button"
                onClick={handleNext}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
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
