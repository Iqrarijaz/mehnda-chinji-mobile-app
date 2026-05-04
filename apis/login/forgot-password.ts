import apiClient from "../client";

/**
 * Check account details
 */
export const checkAccountDetails = async (email: string) => {
    return apiClient.post('/auth/user/check-account-details', { emailOrPhone: email });
};

/**
 * Send OTP
 */
export const sendOtp = async (email: string, otpCase = "FORGOT_PASSWORD") => {
    return apiClient.post('/auth/user/send-otp', { email, otpCase });
};

/**
 * Verify OTP
 */
export const verifyOtp = async (email: string, otp: string, otpCase = "FORGOT_PASSWORD") => {
    return apiClient.post('/auth/user/verify-otp', { email, otp, otpCase });
};

/**
 * Reset password with token
 */
export const resetPassword = async (email: string, otp: string, newPassword: string) => {
    return apiClient.post('/auth/user/reset-password', { emailOrPhone: email, otp, newPassword });
};
