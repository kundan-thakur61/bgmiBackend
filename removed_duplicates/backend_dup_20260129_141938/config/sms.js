/**
 * SMS Service using MSG91 (India-focused)
 * More cost-effective for Indian users
 */

/**
 * Send SMS using MSG91
 * @param {string} phone - Phone number (10 digits for India)
 * @param {string} message - SMS message content
 * @returns {Promise<object>} - MSG91 response
 */
const sendSMS = async (phone, message) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'BTLZON';
  
  if (!authKey) {
    console.log('⚠️ MSG91 not configured. SMS not sent.');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    // Format phone number (remove +91 if present, keep 10 digits)
    const formattedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
    
    // MSG91 Send OTP API
    const url = `https://control.msg91.com/api/v5/flow/`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        short_url: '0',
        mobiles: `91${formattedPhone}`,
        VAR1: message // OTP variable in template
      })
    });

    const result = await response.json();
    
    if (result.type === 'success') {
      console.log(`📱 SMS sent to ${formattedPhone} via MSG91`);
      return { success: true, messageId: result.request_id };
    } else {
      console.error('❌ MSG91 error:', result.message);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP using MSG91's dedicated OTP API
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @returns {Promise<object>}
 */
const sendOTP = async (phone, otp) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  
  if (!authKey) {
    console.log('⚠️ MSG91 not configured. SMS not sent.');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    // Format phone number
    const formattedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
    
    // Use MSG91 Send OTP API (simpler approach)
    const url = `https://api.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${formattedPhone}&authkey=${authKey}&otp=${otp}`;
    
    const response = await fetch(url, {
      method: 'GET'
    });

    const result = await response.json();
    
    if (result.type === 'success') {
      console.log(`📱 OTP sent to ${formattedPhone} via MSG91`);
      return { success: true, messageId: result.request_id };
    } else {
      // Fallback: Try simple SMS API
      console.log('Trying MSG91 simple SMS API...');
      return await sendSimpleSMS(formattedPhone, otp, authKey);
    }
  } catch (error) {
    console.error('❌ OTP sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Fallback: Send simple SMS
 */
const sendSimpleSMS = async (phone, otp, authKey) => {
  try {
    const message = encodeURIComponent(`Your BattleZone OTP is ${otp}. Valid for 5 minutes. Do not share.`);
    const senderId = process.env.MSG91_SENDER_ID || 'BTLZON';
    
    const url = `https://api.msg91.com/api/sendhttp.php?authkey=${authKey}&mobiles=91${phone}&message=${message}&sender=${senderId}&route=4&country=91`;
    
    const response = await fetch(url);
    const result = await response.text();
    
    if (result && !result.includes('error')) {
      console.log(`📱 SMS sent to ${phone} via MSG91 (simple API)`);
      return { success: true, messageId: result };
    } else {
      console.error('❌ MSG91 simple API error:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSMS,
  sendOTP
};
