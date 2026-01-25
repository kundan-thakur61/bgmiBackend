'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(''); // For development testing
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
      // In development, backend returns OTP for testing
      if (data.otp) {
        setDevOtp(data.otp);
      }
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
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
      const data = await verifyOtp(phone, otp);
      if (data.isNewUser) {
        // New user - redirect to complete registration
        router.push(`/register?phone=${phone}`);
      } else {
        // Existing user - logged in
        router.push('/matches');
      }
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
          <h1 className="text-2xl font-bold text-center mb-2">
            {step === 'phone' ? 'Login / Sign Up' : 'Verify OTP'}
          </h1>
          <p className="text-dark-400 text-center mb-8">
            {step === 'phone' 
              ? 'Enter your mobile number to continue' 
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
                <label htmlFor="phone" className="label">Mobile Number</label>
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-dark-800 text-dark-400">or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-dark-600 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>
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
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
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

          <div className="mt-6 pt-6 border-t border-dark-700 text-center text-sm text-dark-400">
            <Link href="/forgot-password" className="text-primary-400 hover:text-primary-300 block mb-4">
              Forgot your password?
            </Link>
            By continuing, you agree to our{' '}
            <Link href="/terms-conditions" className="text-primary-400 hover:text-primary-300">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="text-primary-400 hover:text-primary-300">
              Privacy Policy
            </Link>
          </div>
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
