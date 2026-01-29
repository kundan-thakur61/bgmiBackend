// Mocks file - runs before test environment setup
// This file uses Jest's doMock for modules that need mocking

jest.mock('../config/razorpay', () => ({
  getRazorpayInstance: jest.fn().mockReturnValue({
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
  }),
  createOrder: jest.fn().mockResolvedValue({
    id: 'order_test123',
    amount: 10000,
    currency: 'INR'
  }),
  verifyPaymentSignature: jest.fn().mockReturnValue(true),
  fetchPayment: jest.fn().mockResolvedValue({
    status: 'captured',
    method: 'upi',
    vpa: 'test@upi'
  }),
  initiateRefund: jest.fn().mockResolvedValue({ id: 'refund_test123' })
}));

// Mock Cloudinary
jest.mock('../config/cloudinary', () => ({
  uploadScreenshot: jest.fn().mockResolvedValue({
    url: 'https://cloudinary.com/test-screenshot.jpg',
    publicId: 'test-public-id'
  }),
  uploadImage: jest.fn().mockResolvedValue({
    url: 'https://cloudinary.com/test-image.jpg',
    publicId: 'test-public-id'
  })
}));
