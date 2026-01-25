'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError(errorParam);
        return;
      }

      if (!token) {
        setStatus('error');
        setError('No authentication token received');
        return;
      }

      try {
        // Store the token
        localStorage.setItem('token', token);
        
        // Verify and load user data
        await checkAuth();
        
        setStatus('success');
        
        // Redirect to matches page after short delay
        setTimeout(() => {
          router.push('/matches');
        }, 1500);
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Authentication failed');
        localStorage.removeItem('token');
      }
    };

    handleCallback();
  }, [searchParams, router, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark-900">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-2">Signing you in...</h1>
            <p className="text-dark-400">Please wait while we complete your authentication</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-400">Login Successful!</h1>
            <p className="text-dark-400">Redirecting you to matches...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-400">Authentication Failed</h1>
            <p className="text-dark-400 mb-6">{error}</p>
            <Link href="/login" className="btn-primary">
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 bg-dark-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="text-dark-400">Please wait while we process your authentication</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}