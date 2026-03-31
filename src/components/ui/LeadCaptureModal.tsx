import { useState, useEffect } from 'react';
import { X, Gift, Phone, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { saveLead, shouldShowLeadCapture, getExistingLead } from '@/services/visitorTracker';

export function LeadCaptureModal() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check after a delay to avoid showing immediately
    const timer = setTimeout(() => {
      if (shouldShowLeadCapture() && !dismissed) {
        setShow(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  // Re-check on route changes
  useEffect(() => {
    if (dismissed || getExistingLead()) return;
    const interval = setInterval(() => {
      if (shouldShowLeadCapture()) {
        setShow(true);
        clearInterval(interval);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [dismissed]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone && !email) return;
    saveLead({ name, phone, email }, 'engagement_prompt');
    setSubmitted(true);
    setTimeout(() => setShow(false), 2000);
  }

  function handleDismiss() {
    setDismissed(true);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X size={16} className="text-gray-400" />
        </button>

        {submitted ? (
          // Success state
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Gift size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-sm text-gray-500">We'll keep you updated on new features and market insights.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0b8a00]/10 to-emerald-50 px-6 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b8a00] flex items-center justify-center">
                  <Gift size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Save Your Progress</h3>
                  <p className="text-xs text-gray-500">Get market alerts & exclusive tips</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                You're doing great! Leave your contact info to save your learning progress and get daily DSE market insights.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3.5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                  <User size={12} /> Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/30 focus:border-[#0b8a00]/30"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                  <Phone size={12} /> Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+880 1XXX XXXXXX"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/30 focus:border-[#0b8a00]/30"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                  <Mail size={12} /> Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0b8a00]/30 focus:border-[#0b8a00]/30"
                />
              </div>

              <Button type="submit" className="w-full !py-3" disabled={!phone && !email}>
                Save & Get Updates
              </Button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                Maybe later
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
