const Razorpay = require('razorpay');
const crypto = require('crypto');

// Lazy initialization to support mocking in tests
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

// Create order
const createOrder = async (amount, currency = 'INR', receipt = null) => {
  try {
    const receiptStr = (receipt || `order_${Date.now()}`).substring(0, 40);
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receiptStr,
      payment_capture: 1 // Auto capture
    };
    
    const order = await getRazorpayInstance().orders.create(options);
    return order;
  } catch (error) {
    const msg = error?.error?.description || error?.message || 'Unknown error';
    throw new Error(`Order creation failed: ${msg}`);
  }
};

// Verify payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  
  return generatedSignature === signature;
};

// Fetch payment details
const fetchPayment = async (paymentId) => {
  try {
    const payment = await getRazorpayInstance().payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new Error(`Payment fetch failed: ${error.message}`);
  }
};

// Initiate refund
const initiateRefund = async (paymentId, amount = null) => {
  try {
    const refundOptions = amount ? { amount: amount * 100 } : {};
    const refund = await getRazorpayInstance().payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error) {
    throw new Error(`Refund initiation failed: ${error.message}`);
  }
};

module.exports = {
  getRazorpayInstance,
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  initiateRefund
};
