'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function WalletPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [txData, wdData] = await Promise.all([
        api.getTransactions(),
        api.getWithdrawals()
      ]);
      setTransactions(txData.transactions || []);
      setWithdrawals(wdData.withdrawals || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!amount || parseInt(amount) < 10) {
      setError('Minimum amount is ₹10');
      return;
    }
    // TODO: Integrate with Razorpay
    alert('Razorpay integration coming soon!');
  };

  const handleWithdraw = async () => {
    setError('');
    setSuccess('');
    
    const amt = parseInt(withdrawAmount);
    if (!amt || amt < 100) {
      setError('Minimum withdrawal is ₹100');
      return;
    }
    
    if (amt > (user?.walletBalance || 0)) {
      setError('Insufficient balance');
      return;
    }

    if (withdrawMethod === 'upi' && !upiId) {
      setError('Please enter UPI ID');
      return;
    }

    if (withdrawMethod === 'upi' && !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
      setError('Invalid UPI ID format');
      return;
    }

    if (withdrawMethod === 'bank') {
      if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
        setError('Please fill all bank details');
        return;
      }
      if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
        setError('Account numbers do not match');
        return;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode.toUpperCase())) {
        setError('Invalid IFSC code format');
        return;
      }
    }

    const details = withdrawMethod === 'upi' 
      ? { upiId } 
      : { 
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode.toUpperCase(),
          accountHolderName: bankDetails.accountHolderName
        };

    setProcessing(true);
    try {
      await api.requestWithdrawal(amt, withdrawMethod, details);
      setSuccess('Withdrawal request submitted successfully!');
      setShowWithdraw(false);
      setWithdrawAmount('');
      setUpiId('');
      setBankDetails({ accountNumber: '', confirmAccountNumber: '', ifscCode: '', accountHolderName: '' });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setProcessing(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];
  const withdrawAmounts = [100, 200, 500, 1000];

  const getTransactionColor = (type) => {
    if (['deposit', 'winning', 'refund', 'credit', 'referral_bonus'].includes(type)) return 'text-green-400';
    return 'text-red-400';
  };

  const getTransactionSign = (type) => {
    if (['deposit', 'winning', 'refund', 'credit', 'referral_bonus'].includes(type)) return '+';
    return '-';
  };

  const getWithdrawalStatus = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || colors.pending;
  };

  if (authLoading || !isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold font-display mb-8">Wallet</h1>

          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Balance Card */}
          <div className="card p-6 mb-8 bg-gradient-to-br from-primary-900/50 to-gaming-purple/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-dark-400 text-sm mb-1">Available Balance</p>
                <p className="text-4xl font-bold gradient-text">
                  {formatCurrency(user?.walletBalance || 0)}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAddMoney(!showAddMoney); setShowWithdraw(false); setError(''); }}
                  className="btn-primary"
                >
                  Add Money
                </button>
                <button 
                  onClick={() => { setShowWithdraw(!showWithdraw); setShowAddMoney(false); setError(''); }}
                  className="btn-outline"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Add Money Section */}
            {showAddMoney && (
              <div className="mt-6 pt-6 border-t border-dark-600">
                <h3 className="font-medium mb-4">Add Money to Wallet</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickAmounts.map((qa) => (
                    <button
                      key={qa}
                      onClick={() => setAmount(qa.toString())}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        amount === qa.toString()
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                          : 'border-dark-600 hover:border-dark-500'
                      }`}
                    >
                      ₹{qa}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="input flex-1"
                    min="10"
                  />
                  <button onClick={handleAddMoney} className="btn-primary">
                    Pay ₹{amount || 0}
                  </button>
                </div>
              </div>
            )}

            {/* Withdraw Section */}
            {showWithdraw && (
              <div className="mt-6 pt-6 border-t border-dark-600">
                <h3 className="font-medium mb-4">Withdraw Money</h3>
                
                {user?.kycStatus !== 'verified' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-4">
                    <span className="font-medium">KYC Required:</span> Please complete KYC verification to withdraw funds.
                    <button onClick={() => router.push('/kyc')} className="ml-2 underline">Complete KYC</button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {withdrawAmounts.map((wa) => (
                    <button
                      key={wa}
                      onClick={() => setWithdrawAmount(wa.toString())}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        withdrawAmount === wa.toString()
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                          : 'border-dark-600 hover:border-dark-500'
                      }`}
                    >
                      ₹{wa}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Amount</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount (min ₹100)"
                      className="input w-full"
                      min="100"
                    />
                  </div>

                  <div>
                    <label className="label">Withdrawal Method</label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      className="input w-full"
                    >
                      <option value="upi">UPI</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>

                  {withdrawMethod === 'upi' && (
                    <div>
                      <label className="label">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="input w-full"
                      />
                    </div>
                  )}

                  {withdrawMethod === 'bank' && (
                    <div className="space-y-4">
                      <div>
                        <label className="label">Account Holder Name</label>
                        <input
                          type="text"
                          value={bankDetails.accountHolderName}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                          placeholder="As per bank records"
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="label">Account Number</label>
                        <input
                          type="text"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '') })}
                          placeholder="Enter account number"
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="label">Confirm Account Number</label>
                        <input
                          type="text"
                          value={bankDetails.confirmAccountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                          placeholder="Re-enter account number"
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="label">IFSC Code</label>
                        <input
                          type="text"
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                          placeholder="e.g., SBIN0001234"
                          className="input w-full"
                          maxLength={11}
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleWithdraw} 
                    disabled={processing || user?.kycStatus !== 'verified'}
                    className="btn-primary w-full"
                  >
                    {processing ? 'Processing...' : `Withdraw ₹${withdrawAmount || 0}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pending Withdrawals */}
          {withdrawals.filter(w => w.status === 'pending').length > 0 && (
            <div className="card mb-6">
              <div className="p-4 border-b border-dark-700">
                <h2 className="font-semibold">Pending Withdrawals</h2>
              </div>
              <div className="divide-y divide-dark-700">
                {withdrawals.filter(w => w.status === 'pending').map((wd) => (
                  <div key={wd._id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{formatCurrency(wd.amount)} via {wd.method?.toUpperCase()}</p>
                      <p className="text-sm text-dark-400">{formatDateTime(wd.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getWithdrawalStatus(wd.status)}`}>
                      {wd.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          <div className="card">
            <div className="p-4 border-b border-dark-700">
              <h2 className="font-semibold">Transaction History</h2>
            </div>
            
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex justify-between">
                    <div className="h-4 bg-dark-700 rounded w-1/2" />
                    <div className="h-4 bg-dark-700 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-dark-400">
                <p className="text-4xl mb-2">💰</p>
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Add money to your wallet to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-700">
                {transactions.map((tx) => (
                  <div key={tx._id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-dark-400">{formatDateTime(tx.createdAt)}</p>
                    </div>
                    <div className={`font-semibold ${getTransactionColor(tx.type)}`}>
                      {getTransactionSign(tx.type)}{formatCurrency(Math.abs(tx.amount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
