// Mock Razorpay module for tests

const mockRazorpayInstance = {
  orders: {
    create: jest.fn().mockResolvedValue({
      id: 'order_test123',
      amount: 10000,
      currency: 'INR'
    })
  },
  payments: {
    fetch: jest.fn().mockResolvedValue({
      status: 'captured',
      method: 'upi',
      vpa: 'test@upi'
    }),
    refund: jest.fn().mockResolvedValue({ id: 'refund_test123' })
  }
};

const getRazorpayInstance = jest.fn().mockReturnValue(mockRazorpayInstance);

const createOrder = jest.fn().mockResolvedValue({
  id: 'order_test123',
  amount: 10000,
  currency: 'INR'
});

const verifyPaymentSignature = jest.fn().mockReturnValue(true);

const fetchPayment = jest.fn().mockResolvedValue({
  status: 'captured',
  method: 'upi',
  vpa: 'test@upi'
});

const initiateRefund = jest.fn().mockResolvedValue({ id: 'refund_test123' });

module.exports = {
  getRazorpayInstance,
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  initiateRefund
};
