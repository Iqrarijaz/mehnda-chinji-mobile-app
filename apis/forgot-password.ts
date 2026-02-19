import { baseUrl } from "@/configs";

/**
 * Request password reset
 */
export const REQUEST_PASSWORD_RESET = async (emailOrPhone: string) => {
    const response = await fetch(`${baseUrl}/auth/user/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset');
    }

    return data;
};

/**
 * Reset password with token
 */
export const RESET_PASSWORD = async (emailOrPhone: string, resetToken: string, newPassword: string) => {
    const response = await fetch(`${baseUrl}/auth/user/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone, resetToken, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
    }

    return data;
};
