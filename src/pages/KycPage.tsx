import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Profile, KycDocument } from '@/types';
import {
  ShieldCheck, Upload, CheckCircle, Clock, XCircle, FileText, Camera,
  CreditCard, UserPlus, Trash2, ChevronRight, ChevronLeft, Building2,
  Landmark, User, Globe, AlertTriangle, Send, Eye, Briefcase,
} from 'lucide-react';

const STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'identity', label: 'Identity & Tax', icon: CreditCard },
  { id: 'bank', label: 'Bank & BO', icon: Landmark },
  { id: 'nominee', label: 'Nominee', icon: UserPlus },
  { id: 'documents', label: 'Documents', icon: Upload },
  { id: 'investment', label: 'Investment Profile', icon: Briefcase },
  { id: 'review', label: 'Review & Submit', icon: Send },
] as const;

type StepId = typeof STEPS[number]['id'];

const DOCUMENT_TYPES = [
  { type: 'nid_front', label: 'NID Front', icon: CreditCard, description: 'Front side of your National ID card', required: true },
  { type: 'nid_back', label: 'NID Back', icon: CreditCard, description: 'Back side of your National ID card', required: true },
  { type: 'photo', label: 'Passport Photo', icon: Camera, description: 'Recent passport-size photograph', required: true },
  { type: 'signature', label: 'Signature', icon: FileText, description: 'Scanned copy of your signature', required: true },
  { type: 'bank_statement', label: 'Bank Statement', icon: FileText, description: 'Bank statement (last 3 months)', required: true },
  { type: 'tin_cert', label: 'TIN Certificate', icon: FileText, description: 'Tax Identification Number certificate', required: false },
  { type: 'address_proof', label: 'Address Proof', icon: FileText, description: 'Utility bill or other address proof', required: false },
  { type: 'income_proof', label: 'Income Proof', icon: FileText, description: 'Salary slip or income certificate', required: false },
] as const;

const SELECT_OPTIONS = {
  gender: ['Male', 'Female', 'Other'],
  marital_status: ['Single', 'Married', 'Divorced', 'Widowed'],
  nid_type: [
    { value: 'nid', label: 'National ID (NID)' },
    { value: 'passport', label: 'Passport' },
    { value: 'birth_cert', label: 'Birth Certificate' },
  ],
  bo_type: [
    { value: 'individual', label: 'Individual' },
    { value: 'joint', label: 'Joint Account' },
    { value: 'corporate', label: 'Corporate' },
  ],
  investor_category: [
    { value: 'RB', label: 'Retail (RB)' },
    { value: 'MB', label: 'Margin (MB)' },
    { value: 'NRB', label: 'Non-Resident (NRB)' },
    { value: 'FI', label: 'Financial Institution (FI)' },
    { value: 'MF', label: 'Mutual Fund (MF)' },
  ],
  account_type: [
    { value: 'Cash', label: 'Cash Account' },
    { value: 'Margin', label: 'Margin Account' },
  ],
  investment_experience: [
    { value: 'none', label: 'No experience' },
    { value: '1-3yr', label: '1-3 years' },
    { value: '3-5yr', label: '3-5 years' },
    { value: '5yr+', label: '5+ years' },
  ],
  risk_tolerance: [
    { value: 'conservative', label: 'Conservative — Preserve capital' },
    { value: 'moderate', label: 'Moderate — Balanced growth' },
    { value: 'aggressive', label: 'Aggressive — Maximum returns' },
  ],
  investment_objective: [
    { value: 'capital_preservation', label: 'Capital Preservation' },
    { value: 'income', label: 'Regular Income (Dividends)' },
    { value: 'growth', label: 'Long-term Growth' },
    { value: 'speculation', label: 'Short-term Trading' },
  ],
  annual_income: [
    'Below BDT 3,00,000',
    'BDT 3,00,000 - 5,00,000',
    'BDT 5,00,000 - 10,00,000',
    'BDT 10,00,000 - 25,00,000',
    'BDT 25,00,000 - 50,00,000',
    'Above BDT 50,00,000',
  ],
  districts: [
    'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
    'Comilla', 'Gazipur', 'Narayanganj', 'Cox\'s Bazar', 'Jessore', 'Bogra', 'Dinajpur', 'Other',
  ],
};

function Select({ label, value, onChange, options, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background text-sm text-foreground px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
      >
        <option value="">Select...</option>
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}

function StepIndicator({ steps, currentStep, completedSteps }: {
  steps: typeof STEPS;
  currentStep: StepId;
  completedSteps: Set<StepId>;
}) {
  const currentIdx = steps.findIndex(s => s.id === currentStep);
  return (
    <div className="hidden md:flex items-center gap-1 mb-8">
      {steps.map((step, i) => {
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.has(step.id);
        const isPast = i < currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              isActive && 'bg-primary/10 text-primary border border-primary/20',
              isCompleted && !isActive && 'bg-success/10 text-success',
              !isActive && !isCompleted && isPast && 'text-muted',
              !isActive && !isCompleted && !isPast && 'text-muted/50',
            )}>
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                isActive && 'bg-primary text-white',
                isCompleted && !isActive && 'bg-success text-white',
                !isActive && !isCompleted && 'bg-gray-100 text-gray-400',
              )}>
                {isCompleted && !isActive ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className="hidden lg:inline">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={14} className="text-muted/30 mx-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MobileStepIndicator({ steps, currentStep }: { steps: typeof STEPS; currentStep: StepId }) {
  const currentIdx = steps.findIndex(s => s.id === currentStep);
  const step = steps[currentIdx];
  const Icon = step.icon;
  return (
    <div className="md:hidden mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
            {currentIdx + 1}
          </div>
          <div>
            <p className="text-sm font-semibold">{step.label}</p>
            <p className="text-[10px] text-muted">Step {currentIdx + 1} of {steps.length}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full', i <= currentIdx ? 'bg-primary' : 'bg-gray-100')} />
        ))}
      </div>
    </div>
  );
}

export function KycPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<StepId>('personal');
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, KycDocument>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [form, setForm] = useState<Partial<Profile>>({
    nationality: 'Bangladeshi',
    nid_type: 'nid',
    investor_category: 'RB',
    account_type: 'Cash',
    bo_type: 'individual',
    is_pep: false,
    declaration_signed: false,
  });

  const [nominees, setNominees] = useState<{ name: string; relation: string; nid: string; phone: string; share_pct: number }[]>([]);

  const updateForm = useCallback((updates: Partial<Profile>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setForm(prev => ({ ...prev, ...data }));
        if (data.family_info) {
          setNominees(data.family_info.map((m: any) => ({
            name: m.name || '', relation: m.relation || '', nid: m.nid || '', phone: m.phone || '', share_pct: 100,
          })));
        }
      }
      const { data: docs } = await supabase.from('kyc_documents').select('*').eq('user_id', user.id);
      if (docs) {
        const docMap: Record<string, KycDocument> = {};
        docs.forEach((d: KycDocument) => { docMap[d.document_type] = d; });
        setUploadedDocs(docMap);
      }
      setLoadingProfile(false);
    })();
  }, [user?.id]);

  async function handleUpload(docType: string, file: File) {
    if (!user?.id) return;
    setUploading(docType);
    try {
      const ext = file.name.split('.').pop();
      const path = `kyc/${user.id}/${docType}_v${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
      if (error) throw error;
      const doc = {
        user_id: user.id,
        document_type: docType,
        file_url: path,
        status: 'pending' as const,
        file_size: file.size,
        file_type: file.type,
        version: (uploadedDocs[docType]?.version || 0) + 1,
      };
      await supabase.from('kyc_documents').upsert(doc, { onConflict: 'user_id,document_type' });
      setUploadedDocs(prev => ({ ...prev, [docType]: { ...doc, id: '', uploaded_at: new Date().toISOString() } as KycDocument }));
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(null); }
  }

  async function saveCurrentStep() {
    if (!user?.id) return;
    const profileData: Record<string, any> = {};
    const stepFields: Record<StepId, string[]> = {
      personal: ['full_name', 'father_name', 'mother_name', 'date_of_birth', 'gender', 'marital_status', 'nationality', 'phone', 'present_address', 'permanent_address', 'city', 'district', 'post_code'],
      identity: ['nid_type', 'nid_number', 'tin_number', 'passport_number', 'passport_expiry'],
      bank: ['bank_name', 'bank_account', 'bank_branch', 'bank_routing_number', 'bo_account', 'bo_type', 'cdbl_dp_id'],
      nominee: ['nominee_name', 'nominee_relation', 'nominee_nid', 'nominee_phone', 'nominee_address', 'nominee_share_pct', 'nominee_dob'],
      documents: [],
      investment: ['investor_category', 'account_type', 'occupation', 'organization', 'income_source', 'annual_income', 'net_worth', 'investment_experience', 'risk_tolerance', 'investment_objective'],
      review: ['is_pep', 'pep_details', 'declaration_signed', 'declaration_signed_at'],
    };

    const fields = stepFields[currentStep];
    fields.forEach(f => {
      if ((form as any)[f] !== undefined) profileData[f] = (form as any)[f];
    });

    if (currentStep === 'nominee' && nominees.length > 0) {
      profileData.family_info = nominees;
    }

    if (Object.keys(profileData).length > 0) {
      profileData.last_kyc_update = new Date().toISOString();
      await supabase.from('profiles').update(profileData).eq('id', user.id);
    }
  }

  async function handleNext() {
    await saveCurrentStep();
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].id);
  }

  function handleBack() {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].id);
  }

  async function handleSubmitKyc() {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await saveCurrentStep();
      await supabase.from('profiles').update({
        kyc_status: 'submitted',
        declaration_signed: true,
        declaration_signed_at: new Date().toISOString(),
      }).eq('id', user.id);
      await supabase.from('kyc_submissions').insert({
        user_id: user.id,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      });
      await supabase.from('kyc_approvals').insert({
        user_id: user.id,
        action: 'submitted',
        status_from: user.kyc_status,
        status_to: 'submitted',
        notes: 'Self-submitted via KYC wizard',
      });
      window.location.reload();
    } catch (err) { console.error('Submit failed:', err); }
    finally { setSubmitting(false); }
  }

  const kycStatus = user?.kyc_status || 'pending';
  const requiredDocsUploaded = DOCUMENT_TYPES.filter(d => d.required).every(d => uploadedDocs[d.type]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-white animate-fade-in">
        <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="skeleton h-8 w-64 rounded-lg mb-4" />
          <div className="skeleton h-[500px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <div style={{ maxWidth: 1400, margin: '0 auto' }} className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
              <ShieldCheck size={28} className="text-primary" />
              KYC Verification
            </h1>
            <p className="text-muted text-sm mt-1">BSEC-compliant identity verification for your investment account</p>
          </div>
          <Badge status={kycStatus} label={`Status: ${kycStatus.replace(/_/g, ' ')}`} pulse />
        </div>

        {/* Status Banners */}
        {kycStatus === 'verified' && (
          <div className="rounded-2xl border border-success/20 bg-success/5 p-5 flex items-center gap-4 mb-6">
            <CheckCircle className="text-success shrink-0" size={22} />
            <div>
              <h3 className="font-semibold text-success text-base">KYC Verified</h3>
              <p className="text-sm text-muted mt-0.5">Your identity has been verified. You can now trade on the platform.</p>
            </div>
          </div>
        )}
        {(kycStatus === 'submitted' || kycStatus === 'under_review') && (
          <div className="rounded-2xl border border-info/20 bg-info/5 p-5 flex items-center gap-4 mb-6">
            <Clock className="text-info shrink-0" size={22} />
            <div>
              <h3 className="font-semibold text-info text-base">Under Review</h3>
              <p className="text-sm text-muted mt-0.5">Your documents are being reviewed. This usually takes 1-2 business days.</p>
            </div>
          </div>
        )}
        {kycStatus === 'rejected' && (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5 flex items-center gap-4 mb-6">
            <XCircle className="text-danger shrink-0" size={22} />
            <div>
              <h3 className="font-semibold text-danger text-base">Verification Rejected</h3>
              <p className="text-sm text-muted mt-0.5">Please review the feedback and re-submit your documents.</p>
            </div>
          </div>
        )}

        {/* Wizard Form */}
        {(kycStatus === 'pending' || kycStatus === 'rejected' || kycStatus === 'expired') && (
          <>
            <StepIndicator steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} />
            <MobileStepIndicator steps={STEPS} currentStep={currentStep} />

            {/* Step: Personal Info */}
            {currentStep === 'personal' && (
              <Card>
                <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                  <User size={20} className="text-primary" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Input label="Full Name *" value={form.full_name || ''} onChange={e => updateForm({ full_name: e.target.value })} placeholder="As per NID" />
                  <Input label="Father's Name *" value={form.father_name || ''} onChange={e => updateForm({ father_name: e.target.value })} placeholder="Father's full name" />
                  <Input label="Mother's Name *" value={form.mother_name || ''} onChange={e => updateForm({ mother_name: e.target.value })} placeholder="Mother's full name" />
                  <Input label="Date of Birth *" type="date" value={form.date_of_birth || ''} onChange={e => updateForm({ date_of_birth: e.target.value })} />
                  <Select label="Gender" value={form.gender || ''} onChange={v => updateForm({ gender: v })} options={SELECT_OPTIONS.gender} required />
                  <Select label="Marital Status" value={form.marital_status || ''} onChange={v => updateForm({ marital_status: v })} options={SELECT_OPTIONS.marital_status} />
                  <Input label="Nationality" value={form.nationality || 'Bangladeshi'} onChange={e => updateForm({ nationality: e.target.value })} />
                  <Input label="Phone Number *" value={form.phone || ''} onChange={e => updateForm({ phone: e.target.value })} placeholder="01XXXXXXXXX" />
                  <Input label="Email" value={form.email || ''} onChange={e => updateForm({ email: e.target.value })} placeholder="email@example.com" />
                </div>
                <h3 className="font-semibold text-sm mt-6 mb-4 text-muted">Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Input label="Present Address *" value={form.present_address || ''} onChange={e => updateForm({ present_address: e.target.value })} placeholder="House, Road, Area" />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Permanent Address" value={form.permanent_address || ''} onChange={e => updateForm({ permanent_address: e.target.value })} placeholder="Same as present or enter different" />
                  </div>
                  <Input label="City" value={form.city || ''} onChange={e => updateForm({ city: e.target.value })} />
                  <Select label="District" value={form.district || ''} onChange={v => updateForm({ district: v })} options={SELECT_OPTIONS.districts} required />
                  <Input label="Post Code" value={form.post_code || ''} onChange={e => updateForm({ post_code: e.target.value })} placeholder="1000" />
                </div>
              </Card>
            )}

            {/* Step: Identity & Tax */}
            {currentStep === 'identity' && (
              <Card>
                <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  Identity & Tax Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Select label="ID Type" value={form.nid_type || 'nid'} onChange={v => updateForm({ nid_type: v as any })} options={SELECT_OPTIONS.nid_type} required />
                  <Input label="NID Number *" value={form.nid_number || ''} onChange={e => updateForm({ nid_number: e.target.value })} placeholder="10 or 17 digit NID" />
                  <Input label="TIN Number *" value={form.tin_number || ''} onChange={e => updateForm({ tin_number: e.target.value })} placeholder="Tax Identification Number" />
                  {form.nid_type === 'passport' && (
                    <>
                      <Input label="Passport Number" value={form.passport_number || ''} onChange={e => updateForm({ passport_number: e.target.value })} />
                      <Input label="Passport Expiry" type="date" value={form.passport_expiry || ''} onChange={e => updateForm({ passport_expiry: e.target.value })} />
                    </>
                  )}
                </div>
                <div className="mt-5 p-4 bg-info/5 border border-info/20 rounded-xl">
                  <p className="text-xs text-info flex items-start gap-2">
                    <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                    As per BSEC e-KYC guidelines, your NID and TIN are verified against government databases. Ensure accuracy to avoid delays.
                  </p>
                </div>
              </Card>
            )}

            {/* Step: Bank & BO */}
            {currentStep === 'bank' && (
              <Card>
                <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                  <Landmark size={20} className="text-primary" />
                  Bank & BO Account Details
                </h2>
                <h3 className="font-semibold text-sm mb-4 text-muted">Bank Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                  <Input label="Bank Name *" value={form.bank_name || ''} onChange={e => updateForm({ bank_name: e.target.value })} placeholder="e.g. Dutch-Bangla Bank" />
                  <Input label="Account Number *" value={form.bank_account || ''} onChange={e => updateForm({ bank_account: e.target.value })} placeholder="Bank account number" />
                  <Input label="Branch Name" value={form.bank_branch || ''} onChange={e => updateForm({ bank_branch: e.target.value })} placeholder="Branch name" />
                  <Input label="Routing Number" value={form.bank_routing_number || ''} onChange={e => updateForm({ bank_routing_number: e.target.value })} placeholder="9-digit routing number" />
                </div>
                <h3 className="font-semibold text-sm mb-4 text-muted">Beneficiary Owner (BO) Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Input label="BO Account Number" value={form.bo_account || ''} onChange={e => updateForm({ bo_account: e.target.value })} placeholder="16-digit BO number" />
                  <Select label="BO Account Type" value={form.bo_type || 'individual'} onChange={v => updateForm({ bo_type: v as any })} options={SELECT_OPTIONS.bo_type} />
                  <Input label="CDBL DP ID" value={form.cdbl_dp_id || ''} onChange={e => updateForm({ cdbl_dp_id: e.target.value })} placeholder="Depository Participant ID" />
                </div>
                <div className="mt-5 p-4 bg-warning/5 border border-warning/20 rounded-xl">
                  <p className="text-xs text-warning flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    If you don't have a BO account yet, you can open one through our depository participant. Contact support for assistance.
                  </p>
                </div>
              </Card>
            )}

            {/* Step: Nominee */}
            {currentStep === 'nominee' && (
              <Card>
                <h2 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <UserPlus size={20} className="text-primary" />
                  Nominee Information
                </h2>
                <p className="text-sm text-muted mb-5">As per BSEC regulations, you must designate at least one nominee. Total share must equal 100%.</p>

                {/* Primary Nominee */}
                <div className="p-4 bg-surface rounded-xl border border-border mb-4">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    Primary Nominee
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input label="Full Name *" value={form.nominee_name || ''} onChange={e => updateForm({ nominee_name: e.target.value })} placeholder="Nominee's full name" />
                    <Input label="Relation *" value={form.nominee_relation || ''} onChange={e => updateForm({ nominee_relation: e.target.value })} placeholder="e.g. Spouse, Son, Daughter" />
                    <Input label="NID Number" value={form.nominee_nid || ''} onChange={e => updateForm({ nominee_nid: e.target.value })} placeholder="Nominee's NID" />
                    <Input label="Phone" value={form.nominee_phone || ''} onChange={e => updateForm({ nominee_phone: e.target.value })} placeholder="Nominee's phone" />
                    <Input label="Address" value={form.nominee_address || ''} onChange={e => updateForm({ nominee_address: e.target.value })} placeholder="Nominee's address" />
                    <Input label="Date of Birth" type="date" value={form.nominee_dob || ''} onChange={e => updateForm({ nominee_dob: e.target.value })} />
                    <Input label="Share %" type="number" value={String(form.nominee_share_pct ?? 100)} onChange={e => updateForm({ nominee_share_pct: Number(e.target.value) })} />
                  </div>
                </div>

                {/* Additional Nominees */}
                {nominees.map((nom, idx) => (
                  <div key={idx} className="p-4 bg-surface rounded-xl border border-border mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{idx + 2}</span>
                        Additional Nominee
                      </h3>
                      <button onClick={() => setNominees(nominees.filter((_, i) => i !== idx))} className="w-8 h-8 flex items-center justify-center rounded-lg text-danger hover:bg-danger/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input label="Name" value={nom.name} onChange={e => { const u = [...nominees]; u[idx].name = e.target.value; setNominees(u); }} />
                      <Input label="Relation" value={nom.relation} onChange={e => { const u = [...nominees]; u[idx].relation = e.target.value; setNominees(u); }} />
                      <Input label="NID" value={nom.nid} onChange={e => { const u = [...nominees]; u[idx].nid = e.target.value; setNominees(u); }} />
                      <Input label="Phone" value={nom.phone} onChange={e => { const u = [...nominees]; u[idx].phone = e.target.value; setNominees(u); }} />
                      <Input label="Share %" type="number" value={String(nom.share_pct)} onChange={e => { const u = [...nominees]; u[idx].share_pct = Number(e.target.value); setNominees(u); }} />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setNominees([...nominees, { name: '', relation: '', nid: '', phone: '', share_pct: 0 }])}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-2"
                >
                  <UserPlus size={16} /> Add Another Nominee
                </button>
              </Card>
            )}

            {/* Step: Documents */}
            {currentStep === 'documents' && (
              <Card>
                <h2 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <Upload size={20} className="text-primary" />
                  Document Upload
                </h2>
                <p className="text-sm text-muted mb-5">Upload clear scanned copies. Required documents are marked with *</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {DOCUMENT_TYPES.map(doc => {
                    const uploaded = !!uploadedDocs[doc.type];
                    const docStatus = uploadedDocs[doc.type]?.status;
                    return (
                      <div
                        key={doc.type}
                        className={cn(
                          'border-2 border-dashed rounded-2xl p-5 text-center transition-all',
                          uploaded && docStatus === 'approved' && 'border-success/30 bg-success/5',
                          uploaded && docStatus === 'rejected' && 'border-danger/30 bg-danger/5',
                          uploaded && docStatus !== 'approved' && docStatus !== 'rejected' && 'border-info/30 bg-info/5',
                          !uploaded && 'border-border hover:border-primary/40 hover:bg-primary/5',
                        )}
                      >
                        <doc.icon size={24} className={cn('mx-auto mb-2', uploaded ? 'text-success' : 'text-muted')} />
                        <h4 className="text-xs font-semibold">
                          {doc.label} {doc.required && <span className="text-danger">*</span>}
                        </h4>
                        <p className="text-[10px] text-muted mt-0.5 leading-snug">{doc.description}</p>
                        {uploaded ? (
                          <div className="mt-3">
                            <p className={cn(
                              'text-xs font-medium flex items-center justify-center gap-1',
                              docStatus === 'approved' && 'text-success',
                              docStatus === 'rejected' && 'text-danger',
                              docStatus !== 'approved' && docStatus !== 'rejected' && 'text-info',
                            )}>
                              {docStatus === 'approved' ? <CheckCircle size={12} /> : docStatus === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                              {docStatus === 'approved' ? 'Approved' : docStatus === 'rejected' ? 'Rejected' : 'Uploaded'}
                            </p>
                            <label className="mt-2 inline-block">
                              <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f); }} />
                              <span className="text-[10px] text-primary cursor-pointer hover:underline">Re-upload</span>
                            </label>
                          </div>
                        ) : (
                          <label className="mt-3 inline-block">
                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f); }} />
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-white rounded-xl cursor-pointer hover:bg-primary/90 transition-colors">
                              {uploading === doc.type ? 'Uploading...' : 'Upload'}
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Step: Investment Profile */}
            {currentStep === 'investment' && (
              <Card>
                <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                  <Briefcase size={20} className="text-primary" />
                  Investment Profile & Suitability
                </h2>
                <p className="text-sm text-muted mb-5">BSEC requires investor suitability assessment before account activation.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Input label="Occupation *" value={form.occupation || ''} onChange={e => updateForm({ occupation: e.target.value })} placeholder="e.g. Business, Service" />
                  <Input label="Organization" value={form.organization || ''} onChange={e => updateForm({ organization: e.target.value })} placeholder="Employer/Business name" />
                  <Input label="Source of Income" value={form.income_source || ''} onChange={e => updateForm({ income_source: e.target.value })} placeholder="e.g. Salary, Business" />
                  <Select label="Annual Income" value={form.annual_income || ''} onChange={v => updateForm({ annual_income: v })} options={SELECT_OPTIONS.annual_income} required />
                  <Select label="Investor Category" value={form.investor_category || 'RB'} onChange={v => updateForm({ investor_category: v as any })} options={SELECT_OPTIONS.investor_category} required />
                  <Select label="Account Type" value={form.account_type || 'Cash'} onChange={v => updateForm({ account_type: v as any })} options={SELECT_OPTIONS.account_type} required />
                  <Select label="Investment Experience" value={form.investment_experience || ''} onChange={v => updateForm({ investment_experience: v as any })} options={SELECT_OPTIONS.investment_experience} required />
                  <Select label="Risk Tolerance" value={form.risk_tolerance || ''} onChange={v => updateForm({ risk_tolerance: v as any })} options={SELECT_OPTIONS.risk_tolerance} required />
                  <Select label="Investment Objective" value={form.investment_objective || ''} onChange={v => updateForm({ investment_objective: v as any })} options={SELECT_OPTIONS.investment_objective} required />
                </div>
              </Card>
            )}

            {/* Step: Review & Submit */}
            {currentStep === 'review' && (
              <div className="space-y-5">
                <Card>
                  <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
                    <Eye size={20} className="text-primary" />
                    Review Your Application
                  </h2>

                  {/* Summary Sections */}
                  <div className="space-y-5">
                    <ReviewSection title="Personal Information" onEdit={() => setCurrentStep('personal')}>
                      <ReviewRow label="Full Name" value={form.full_name} />
                      <ReviewRow label="Father's Name" value={form.father_name} />
                      <ReviewRow label="Mother's Name" value={form.mother_name} />
                      <ReviewRow label="Date of Birth" value={form.date_of_birth} />
                      <ReviewRow label="Gender" value={form.gender} />
                      <ReviewRow label="Phone" value={form.phone} />
                      <ReviewRow label="District" value={form.district} />
                      <ReviewRow label="Present Address" value={form.present_address} />
                    </ReviewSection>

                    <ReviewSection title="Identity & Tax" onEdit={() => setCurrentStep('identity')}>
                      <ReviewRow label="NID Number" value={form.nid_number} />
                      <ReviewRow label="TIN Number" value={form.tin_number} />
                      {form.passport_number && <ReviewRow label="Passport" value={form.passport_number} />}
                    </ReviewSection>

                    <ReviewSection title="Bank & BO Account" onEdit={() => setCurrentStep('bank')}>
                      <ReviewRow label="Bank" value={form.bank_name} />
                      <ReviewRow label="Account No" value={form.bank_account} />
                      <ReviewRow label="BO Account" value={form.bo_account} />
                      <ReviewRow label="BO Type" value={form.bo_type} />
                    </ReviewSection>

                    <ReviewSection title="Nominee" onEdit={() => setCurrentStep('nominee')}>
                      <ReviewRow label="Nominee" value={form.nominee_name} />
                      <ReviewRow label="Relation" value={form.nominee_relation} />
                      <ReviewRow label="Share" value={form.nominee_share_pct ? `${form.nominee_share_pct}%` : undefined} />
                    </ReviewSection>

                    <ReviewSection title="Documents" onEdit={() => setCurrentStep('documents')}>
                      <div className="flex flex-wrap gap-2">
                        {DOCUMENT_TYPES.filter(d => d.required).map(d => (
                          <span key={d.type} className={cn(
                            'text-[10px] font-medium px-2 py-1 rounded-full',
                            uploadedDocs[d.type] ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          )}>
                            {uploadedDocs[d.type] ? '✓' : '✗'} {d.label}
                          </span>
                        ))}
                      </div>
                    </ReviewSection>

                    <ReviewSection title="Investment Profile" onEdit={() => setCurrentStep('investment')}>
                      <ReviewRow label="Category" value={form.investor_category} />
                      <ReviewRow label="Account Type" value={form.account_type} />
                      <ReviewRow label="Risk Tolerance" value={form.risk_tolerance} />
                      <ReviewRow label="Objective" value={form.investment_objective} />
                      <ReviewRow label="Experience" value={form.investment_experience} />
                    </ReviewSection>
                  </div>
                </Card>

                {/* Declaration */}
                <Card>
                  <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-warning" />
                    Declaration & Compliance
                  </h2>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.is_pep || false}
                        onChange={e => updateForm({ is_pep: e.target.checked })}
                        className="mt-0.5 w-4 h-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">I am a Politically Exposed Person (PEP)</p>
                        <p className="text-[11px] text-muted mt-0.5">Check if you or your close family member holds a prominent public position</p>
                      </div>
                    </label>

                    {form.is_pep && (
                      <Input label="PEP Details" value={form.pep_details || ''} onChange={e => updateForm({ pep_details: e.target.value })} placeholder="Describe your position or relationship" />
                    )}

                    <label className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.declaration_signed || false}
                        onChange={e => updateForm({ declaration_signed: e.target.checked })}
                        className="mt-0.5 w-4 h-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">I declare that all information provided is true and accurate</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          I understand that providing false information may result in account suspension per BSEC regulations.
                          I authorize the verification of my identity documents and consent to AML/CFT screening.
                        </p>
                      </div>
                    </label>
                  </div>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 'personal'}
                icon={<ChevronLeft size={16} />}
              >
                Back
              </Button>
              <div className="flex items-center gap-3">
                {currentStep !== 'review' ? (
                  <Button onClick={handleNext} icon={<ChevronRight size={16} />}>
                    Save & Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitKyc}
                    loading={submitting}
                    disabled={!form.declaration_signed || !requiredDocsUploaded || !form.nid_number || !form.full_name}
                    icon={<Send size={16} />}
                  >
                    Submit for Verification
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="p-4 bg-surface rounded-xl border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button onClick={onEdit} className="text-[10px] text-primary font-medium hover:underline">Edit</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
        {children}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
      <p className={cn('text-xs font-medium', value ? 'text-foreground' : 'text-danger/60')}>
        {value || 'Not provided'}
      </p>
    </div>
  );
}
