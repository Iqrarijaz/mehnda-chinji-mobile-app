import apiClient from "./client";

/**
 * Check account details
 */
export const checkAccountDetails = async (emailOrPhone: string) => {
    return apiClient.post('/auth/user/check-account-details', { emailOrPhone });
};

/**
 * Send OTP
 */
export const sendOtp = async (emailOrPhone: string, otpCase = "FORGOT_PASSWORD") => {
    const isEmail = emailOrPhone.includes('@');
    const body = isEmail ? { email: emailOrPhone, otpCase } : { phone: emailOrPhone, otpCase };

    return apiClient.post('/auth/user/send-otp', body);
};

/**
 * Verify OTP
 */
export const verifyOtp = async (emailOrPhone: string, otp: string, otpCase = "FORGOT_PASSWORD") => {
    const isEmail = emailOrPhone.includes('@');
    const body = isEmail
        ? { email: emailOrPhone, otp, otpCase }
        : { phone: emailOrPhone, otp, otpCase };

    return apiClient.post('/auth/user/verify-otp', body);
};

/**
 * Reset password with token
 */
export const resetPassword = async (emailOrPhone: string, resetToken: string, newPassword: string) => {
    return apiClient.post('/auth/user/reset-password', { emailOrPhone, resetToken, newPassword });
};
