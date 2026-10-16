import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Building2,
  Users,
  Zap,
  ShieldCheck,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { AppTheme } from '../types';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
}

interface TutorialStep {
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  points: { title: string; desc: string }[];
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const isPurple = theme === 'purple';

  if (!isOpen) return null;

  const steps: TutorialStep[] = [
    {
      badge: 'Step 1 of 5 • The Concept',
      title: 'Welcome to KharchaSplit',
      subtitle: 'The modern bachelor & flatmate expense ledger tailored for shared living in India.',
      icon: <Building2 className="w-8 h-8 text-rose-500" />,
      iconBg: isPurple
        ? 'bg-purple-500/10 border-purple-500/30'
        : 'bg-rose-500/10 border-rose-500/30',
      points: [
        {
          title: 'Zero Awkward Money Talks',
          desc: 'Keep track of flat rent, cook & maid salary, groceries, and Wi-Fi bills transparently.',
        },
        {
          title: 'Always Balanced',
          desc: 'Real-time calculations show who paid what, who owes whom, and exact net balances.',
        },
      ],
    },
    {
      badge: 'Step 2 of 5 • Adding Expenses',
      title: 'Add Flatmates & Split Bills',
      subtitle: 'Split daily costs equally or customize shares in just a couple of taps.',
      icon: <Users className="w-8 h-8 text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      points: [
        {
          title: 'Equal or Custom Splits',
          desc: 'Split evenly across all roommates, or set custom amounts if someone ordered extra items.',
        },
        {
          title: 'Instant Indian Categories',
          desc: 'Quick tags for Maid, Cook, Zepto/Blinkit, Electricity, Swiggy, and LPG Gas Cylinder.',
        },
      ],
    },
    {
      badge: 'Step 3 of 5 • Smart Settlements',
      title: 'Minimum Payments & 1-Tap UPI',
      subtitle: 'Our smart algorithm mathematically reduces transactions to the minimum possible transfers.',
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      iconBg: 'bg-yellow-500/10 border-yellow-500/30',
      points: [
        {
          title: 'Debt Simplification',
          desc: 'Instead of 5 confusing cross-payments, settle all group balances in just 1 or 2 clean transactions.',
        },
        {
          title: 'Instant GPay / PhonePe / Paytm',
          desc: 'Tap "Pay via UPI App" on mobile or scan the on-screen QR code with pre-filled amounts.',
        },
      ],
    },
    {
      badge: 'Step 4 of 5 • Private Rooms',
      title: 'Shared Flats & Admin Security',
      subtitle: 'Collaborate with your real flatmates while keeping your financial records completely private.',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      points: [
        {
          title: 'Knock-to-Join Authentication',
          desc: 'When flatmates search or join via link, the Flat Admin must approve them before room data unlocks.',
        },
        {
          title: 'Admin Powers & Multi-Flat Switcher',
          desc: 'The Room Admin can manage members or transfer admin powers. Easily switch between multiple flats.',
        },
      ],
    },
    {
      badge: 'Step 5 of 5 • Ready to Split',
      title: 'WhatsApp Reports & Profile',
      subtitle: 'Export monthly breakdowns and manage your receiving QR code anytime.',
      icon: <FileText className="w-8 h-8 text-teal-400" />,
      iconBg: 'bg-teal-500/10 border-teal-500/30',
      points: [
        {
          title: '1-Click WhatsApp Summaries',
          desc: 'Send an itemized month-end settlement report directly to your flat WhatsApp group.',
        },
        {
          title: 'Personal Receiving UPI QR',
          desc: 'Configure your profile in the top header or bottom menu to display your personal payment QR code.',
        },
      ],
    },
  ];

  const current = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleFinish = () => {
    try {
      localStorage.setItem('kharchasplit_tutorial_seen', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-white/10 p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Glow Accent */}
        <div
          className={`absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isPurple ? 'bg-purple-500' : 'bg-rose-500'
          }`}
        />

        {/* Top Header with Progress & Skip */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-white/5 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{current.badge}</span>
          </span>

          <button
            type="button"
            onClick={handleFinish}
            className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Skip Tour</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Visual & Titles */}
        <div className="space-y-3 text-center sm:text-left">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto sm:mx-0 border shadow-lg ${current.iconBg}`}
          >
            {current.icon}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              {current.title}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Bullet Points Cards */}
        <div className="space-y-2.5">
          {current.points.map((pt, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-start gap-3"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-left">
                <div className="text-xs font-bold text-white">{pt.title}</div>
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  {pt.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Pagination Dots & Next / Back Navigation */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/5">
          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? isPurple
                      ? 'w-6 bg-purple-400'
                      : 'w-6 bg-rose-500'
                    : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
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

            <button
              type="button"
              onClick={handleNext}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
                isPurple
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/60'
                  : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/60'
              }`}
            >
              <span>{isLast ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
