'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'success'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const data = await sendOtp(phone);
      if (data.otp) {
        setDevOtp(data.otp);
      }
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check if this number is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      setStep('success');
      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push('/matches');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-dark-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-gaming-purple rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <span className="text-2xl font-bold font-display gradient-text">BattleZone</span>
        </Link>

        {/* Card */}
        <div className="card p-8">
          {step === 'success' ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
              <p className="text-dark-400 mb-4">
                You have been logged in successfully.
              </p>
              <p className="text-dark-500 text-sm">
                Redirecting to matches...
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">
                {step === 'phone' ? 'Forgot Password?' : 'Verify OTP'}
              </h1>
              <p className="text-dark-400 text-center mb-8">
                {step === 'phone' 
                  ? "No worries! Enter your registered mobile number and we'll send you an OTP to login." 
                  : `Enter the OTP sent to +91 ${phone}`}
              </p>

              {/* Development OTP Display */}
              {devOtp && step === 'otp' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-6 text-sm">
                  <strong>Dev Mode:</strong> Your OTP is <span className="font-mono text-lg">{devOtp}</span>
                  <p className="text-xs mt-1 text-yellow-500/70">This will be removed in production</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              {step === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div>
                    <label htmlFor="phone" className="label">Registered Mobile Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-dark-600 bg-dark-700 text-dark-300">
                        +91
                      </span>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="input rounded-l-none"
                        placeholder="Enter 10-digit number"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10}
                    className="btn-primary w-full py-3"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="label">Enter OTP</label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="btn-primary w-full py-3"
                  >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('phone');
                        setOtp('');
                        setError('');
                        setDevOtp('');
                      }}
                      className="text-dark-400 hover:text-white text-sm"
                    >
                      ← Change number
                    </button>
                    <span className="text-dark-600 mx-2">|</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-primary-400 hover:text-primary-300 text-sm"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {step !== 'success' && (
            <div className="mt-6 pt-6 border-t border-dark-700 text-center text-sm">
              <span className="text-dark-400">
                Remember your password?{' '}
                <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                  Sign in
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-dark-400 hover:text-white text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
