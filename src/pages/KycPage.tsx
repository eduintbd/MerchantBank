import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ShieldCheck, Upload, CheckCircle, Clock, XCircle, FileText, Camera, CreditCard, UserPlus, Trash2 } from 'lucide-react';

const documentTypes = [
  { type: 'nid_front', label: 'NID Front', icon: CreditCard, description: 'Front side of your National ID card' },
  { type: 'nid_back', label: 'NID Back', icon: CreditCard, description: 'Back side of your National ID card' },
  { type: 'photo', label: 'Passport Photo', icon: Camera, description: 'Recent passport-size photograph' },
  { type: 'signature', label: 'Signature', icon: FileText, description: 'Scanned copy of your signature' },
  { type: 'bank_statement', label: 'Bank Statement', icon: FileText, description: 'Recent bank statement (last 3 months)' },
] as const;

export function KycPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [nidNumber, setNidNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [boAccount, setBoAccount] = useState('');
  const [familyMembers, setFamilyMembers] = useState<{ name: string; relation: string; nid: string; phone: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(docType: string, file: File) {
    setUploading(docType);
    try {
      const ext = file.name.split('.').pop();
      const path = `kyc/${user?.id}/${docType}.${ext}`;
      const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
      if (error) throw error;
      await supabase.from('kyc_documents').upsert({ user_id: user?.id, document_type: docType, file_url: path, status: 'pending' });
      setUploadedDocs(prev => ({ ...prev, [docType]: true }));
    } catch (err) { console.error('Upload failed:', err); }
    finally { setUploading(null); }
  }

  async function handleSubmitKyc() {
    setSubmitting(true);
    try {
      await supabase.from('profiles').update({ kyc_status: 'submitted', nid_number: nidNumber, tin_number: tinNumber, bo_account: boAccount, family_info: familyMembers.length > 0 ? familyMembers : undefined }).eq('id', user?.id);
      await supabase.from('kyc_submissions').insert({ user_id: user?.id, status: 'submitted', submitted_at: new Date().toISOString() });
    } catch (err) { console.error('Submit failed:', err); }
    finally { setSubmitting(false); }
  }

  const kycStatus = user?.kyc_status || 'pending';
  const allDocsUploaded = documentTypes.every(d => uploadedDocs[d.type]);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">KYC Verification</h1>
          <p className="text-muted text-sm sm:text-base mt-1">Complete identity verification to start trading</p>
        </div>
        <Badge status={kycStatus} label={`Status: ${kycStatus}`} pulse />
      </div>

      {/* Status Banners */}
      {kycStatus === 'verified' && (
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5 flex items-center gap-4 mb-6 sm:mb-8">
          <CheckCircle className="text-success shrink-0" size={22} />
          <div>
            <h3 className="font-semibold text-success text-base">KYC Verified</h3>
            <p className="text-sm text-muted mt-0.5">Your identity has been verified. You can now trade on the platform.</p>
          </div>
        </div>
      )}
      {kycStatus === 'submitted' && (
        <div className="rounded-2xl border border-info/20 bg-info/5 p-5 flex items-center gap-4 mb-6 sm:mb-8">
          <Clock className="text-info shrink-0" size={22} />
          <div>
            <h3 className="font-semibold text-info text-base">Under Review</h3>
            <p className="text-sm text-muted mt-0.5">Your documents are being reviewed. This usually takes 1-2 business days.</p>
          </div>
        </div>
      )}
      {kycStatus === 'rejected' && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5 flex items-center gap-4 mb-6 sm:mb-8">
          <XCircle className="text-danger shrink-0" size={22} />
          <div>
            <h3 className="font-semibold text-danger text-base">Verification Rejected</h3>
            <p className="text-sm text-muted mt-0.5">Please re-upload your documents with clear, valid information.</p>
          </div>
        </div>
      )}

      {(kycStatus === 'pending' || kycStatus === 'rejected') && (
        <div className="space-y-6 sm:space-y-8">
          {/* Personal Info */}
          <Card>
            <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
              <ShieldCheck size={20} className="text-info" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="NID Number" value={nidNumber} onChange={e => setNidNumber(e.target.value)} placeholder="Enter your NID number" />
              <Input label="TIN (Tax Identification Number)" value={tinNumber} onChange={e => setTinNumber(e.target.value)} placeholder="Enter your TIN" />
              <Input label="BO Account Number" value={boAccount} onChange={e => setBoAccount(e.target.value)} placeholder="Enter your BO account number" />
            </div>
          </Card>

          {/* Family Information */}
          <Card>
            <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
              <UserPlus size={20} className="text-info" />
              Family Information
            </h2>
            <p className="text-sm text-muted mb-4">Add family members or nominees for your investment account.</p>
            {familyMembers.map((member, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3 p-4 bg-surface rounded-xl border border-border">
                <Input label="Name" value={member.name} onChange={e => { const updated = [...familyMembers]; updated[idx].name = e.target.value; setFamilyMembers(updated); }} placeholder="Full name" />
                <Input label="Relation" value={member.relation} onChange={e => { const updated = [...familyMembers]; updated[idx].relation = e.target.value; setFamilyMembers(updated); }} placeholder="e.g. Spouse" />
                <Input label="NID" value={member.nid} onChange={e => { const updated = [...familyMembers]; updated[idx].nid = e.target.value; setFamilyMembers(updated); }} placeholder="NID number" />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label="Phone" value={member.phone} onChange={e => { const updated = [...familyMembers]; updated[idx].phone = e.target.value; setFamilyMembers(updated); }} placeholder="Phone" />
                  </div>
                  <button onClick={() => setFamilyMembers(familyMembers.filter((_, i) => i !== idx))} className="mb-1 w-9 h-9 flex items-center justify-center rounded-lg text-danger hover:bg-danger/10 transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setFamilyMembers([...familyMembers, { name: '', relation: '', nid: '', phone: '' }])}
              className="flex items-center gap-2 text-sm font-medium text-info hover:text-info/80 transition-colors mt-2"
            >
              <UserPlus size={16} /> Add Family Member
            </button>
          </Card>

          {/* Document Upload */}
          <Card>
            <h2 className="font-semibold text-base mb-5 flex items-center gap-2">
              <Upload size={20} className="text-info" />
              Upload Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {documentTypes.map(doc => (
                <div
                  key={doc.type}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-6 text-center transition-all',
                    uploadedDocs[doc.type]
                      ? 'border-success/30 bg-success/5'
                      : 'border-border hover:border-info/40 hover:bg-info/5'
                  )}
                >
                  <doc.icon size={28} className={cn('mx-auto mb-3', uploadedDocs[doc.type] ? 'text-success' : 'text-muted')} />
                  <h4 className="text-sm font-semibold">{doc.label}</h4>
                  <p className="text-xs text-muted mt-1">{doc.description}</p>
                  {uploadedDocs[doc.type] ? (
                    <p className="text-sm text-success font-medium mt-3 flex items-center justify-center gap-1.5">
                      <CheckCircle size={16} /> Uploaded
                    </p>
                  ) : (
                    <label className="mt-4 inline-block">
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f); }} />
                      <span className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-xl cursor-pointer hover:bg-primary-light transition-colors">
                        {uploading === doc.type ? 'Uploading...' : 'Upload'}
                      </span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSubmitKyc} loading={submitting} disabled={!allDocsUploaded || !nidNumber} icon={<ShieldCheck size={16} />}>
              Submit for Verification
            </Button>
          </div>
        </div>
      )}      </div>

    </div>
  );
}