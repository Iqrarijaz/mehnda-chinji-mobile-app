import * as yup from 'yup';

/**
 * Regex for strict email validation
 */
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Regex for password complexity:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&#)
 */
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

export const loginSchema = yup.object().shape({
    email: yup.string().matches(emailRegex, 'Invalid email format').required('Email is required'),
    password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object().shape({
    fullName: yup.string().min(3, 'Name must be at least 3 characters').required('Full Name is required'),
    email: yup.string().matches(emailRegex, 'Invalid email format').required('Email is required'),
    phone: yup.string().length(11, 'Phone must be exactly 11 digits').matches(/^[0-9]+$/, 'Phone must contain only numbers').required('Phone is required'),
    password: yup.string().matches(passwordRegex, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character').required('Password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
    ageVerified: yup.boolean().oneOf([true], 'You must be at least 13 years old'),
    termsAccepted: yup.boolean().oneOf([true], 'You must accept the Terms & Conditions'),
    guidelinesAccepted: yup.boolean().oneOf([true], 'You must accept the Community Guidelines'),
});

export const profileSchema = yup.object().shape({
    name: yup.string().min(3, 'Name must be at least 3 characters').required('Full Name is required'),
    phone: yup.string().required('Phone is required'),
    gender: yup.string().nullable(),
    city: yup.string().nullable(),
    village: yup.string().nullable(),
});

export const forgotPasswordSchema = yup.object().shape({
    email: yup.string().matches(emailRegex, 'Invalid email format').required('Email is required'),
});

export const resetPasswordSchema = yup.object().shape({
    password: yup.string().matches(passwordRegex, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character').required('Password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
});

/**
 * Calculates password strength on a scale of 0 to 4:
 * 0: Empty/Very Week
 * 1: Weak (length Only)
 * 2: Fair (length + casing)
 * 3: Good (length + casing + numbers)
 * 4: Strong (all requirements met)
 */
export const getPasswordStrength = (password: string): number => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&#]/.test(password)) strength += 1;
    return strength;
};
