'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function KYCPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    documentType: 'aadhaar',
    documentNumber: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    },
  });
  const [documentFront, setDocumentFront] = useState(null);
  const [documentBack, setDocumentBack] = useState(null);
  const [selfie, setSelfie] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchKYCStatus();
    }
  }, [isAuthenticated]);

  const fetchKYCStatus = async () => {
    try {
      const data = await api.getKYCStatus();
      setKycStatus(data.kyc);
      if (data.kyc?.status === 'pending' || data.kyc?.status === 'approved') {
        // Pre-fill form with existing data
        if (data.kyc.name) setFormData(prev => ({ ...prev, name: data.kyc.name }));
      }
    } catch (err) {
      // No KYC submitted yet
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.name);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('documentType', formData.documentType);
      submitData.append('documentNumber', formData.documentNumber);
      submitData.append('address', JSON.stringify(formData.address));
      
      if (documentFront) submitData.append('documentFront', documentFront);
      if (documentBack) submitData.append('documentBack', documentBack);
      if (selfie) submitData.append('selfie', selfie);

      await api.submitKYC(submitData);
      setSuccess('KYC submitted successfully! We will verify your documents within 24-48 hours.');
      fetchKYCStatus();
    } catch (err) {
      setError(err.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  const documentTypes = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'voter_id', label: 'Voter ID' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'passport', label: 'Passport' },
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh',
  ];

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-dark-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-2xl font-bold mb-2">KYC Verification</h1>
          <p className="text-dark-400 mb-6">Complete KYC to enable withdrawals</p>

          {/* KYC Status Banner */}
          {kycStatus && (
            <div className={`card p-4 mb-6 ${
              kycStatus.status === 'approved' ? 'border border-green-500/30 bg-green-500/10' :
              kycStatus.status === 'pending' ? 'border border-yellow-500/30 bg-yellow-500/10' :
              kycStatus.status === 'rejected' ? 'border border-red-500/30 bg-red-500/10' :
              'border border-dark-600'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {kycStatus.status === 'approved' ? '✅' :
                   kycStatus.status === 'pending' ? '⏳' :
                   kycStatus.status === 'rejected' ? '❌' : '📋'}
                </div>
                <div>
                  <h3 className="font-medium capitalize">
                    KYC {kycStatus.status}
                  </h3>
                  <p className="text-sm text-dark-400">
                    {kycStatus.status === 'approved' && 'Your KYC has been verified. You can now make withdrawals.'}
                    {kycStatus.status === 'pending' && 'Your KYC is under review. This usually takes 24-48 hours.'}
                    {kycStatus.status === 'rejected' && `Reason: ${kycStatus.rejectionReason || 'Documents not clear'}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show form only if not approved */}
          {kycStatus?.status !== 'approved' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              {/* Personal Details */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-4">Personal Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name (as on document)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Document Details */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-4">Document Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Document Type</label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                      className="input"
                    >
                      {documentTypes.map(doc => (
                        <option key={doc.value} value={doc.value}>{doc.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Document Number</label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value.toUpperCase() })}
                      className="input"
                      placeholder={formData.documentType === 'aadhaar' ? '1234 5678 9012' : 'ABCDE1234F'}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-4">Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.address.line1}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={formData.address.line2}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line2: e.target.value } })}
                      className="input"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">City</label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <select
                        value={formData.address.state}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                        className="input"
                        required
                      >
                        <option value="">Select State</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Pincode</label>
                      <input
                        type="text"
                        value={formData.address.pincode}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
                        className="input"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="card p-6">
                <h2 className="text-lg font-bold mb-4">Upload Documents</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Document Front</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDocumentFront(e.target.files[0])}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="label">Document Back</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDocumentBack(e.target.files[0])}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="label">Selfie with Document</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelfie(e.target.files[0])}
                      className="input text-sm"
                    />
                  </div>
                </div>
                <p className="text-dark-500 text-xs mt-2">
                  Accepted formats: JPG, PNG. Max size: 5MB each.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3"
              >
                {submitting ? 'Submitting...' : 'Submit KYC'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
