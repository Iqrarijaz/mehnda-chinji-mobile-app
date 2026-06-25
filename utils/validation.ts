import * as yup from 'yup';

/**
 * Regex for strict email validation
 */
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Regex for password:
 * - Exactly 6 digits
 */
export const passwordRegex = /^.{6,}$/;

export const loginSchema = yup.object().shape({
    email: yup.string().matches(emailRegex, 'Invalid email format').required('Email or phone is required'),
    password: yup.string().matches(passwordRegex, 'Password must be at least 6 characters').required('Password is required'),
});

export const registerSchema = yup.object().shape({
    fullName: yup.string().min(3, 'Name must be at least 3 characters').required('Full Name is required'),
    email: yup.string().matches(emailRegex, 'Invalid email format').required('Email is required'),
    phone: yup.string().length(11, 'Phone must be exactly 11 digits').matches(/^[0-9]+$/, 'Phone must contain only numbers').required('Phone is required'),
    password: yup.string().matches(passwordRegex, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
    ageVerified: yup.boolean().oneOf([true], 'You must be at least 13 years old'),
    termsAccepted: yup.boolean().oneOf([true], 'You must accept the Terms & Conditions'),
    guidelinesAccepted: yup.boolean().oneOf([true], 'You must accept the Community Guidelines'),
});

export const profileSchema = yup.object().shape({
    name: yup.string().min(3, 'Name must be at least 3 characters').required('Full Name is required'),
    phone: yup.string()
        .length(11, 'Phone number must be exactly 11 digits')
        .matches(/^03[0-9]{9}$/, 'Phone number must start with 03 and contain only digits')
        .required('Phone is required'),
    gender: yup.string().nullable(),
    city: yup.string().required('City is required'),
    village: yup.string().nullable(),
});

export const forgotPasswordSchema = yup.object().shape({
    email: yup.string().matches(emailRegex, 'Invalid email format').required('Email is required'),
});

export const resetPasswordSchema = yup.object().shape({
    password: yup.string().matches(passwordRegex, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
});

/**
 * Calculates password strength on a scale of 0 to 4 based on length:
 * 0: Empty
 * 1: Weak (< 6)
 * 2: Fair (6-7)
 * 3: Good (8-9)
 * 4: Strong (10+)
 */
export const getPasswordStrength = (password: string): number => {
    if (!password) return 0;
    if (password.length < 6) return 1;
    if (password.length < 8) return 2;
    if (password.length < 10) return 3;
    return 4;
};
