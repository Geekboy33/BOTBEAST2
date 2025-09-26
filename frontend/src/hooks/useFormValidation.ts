// src/hooks/useFormValidation.ts
import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FormData {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string;
}

export const useFormValidation = (
  initialData: FormData,
  rules: ValidationRules
) => {
  const [data, setData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value === '')) {
      return `${name} es requerido`;
    }

    // Skip other validations if value is empty and not required
    if (!value || value === '') return null;

    // Min validation
    if (rule.min !== undefined && value < rule.min) {
      return `${name} debe ser mayor o igual a ${rule.min}`;
    }

    // Max validation
    if (rule.max !== undefined && value > rule.max) {
      return `${name} debe ser menor o igual a ${rule.max}`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${name} tiene un formato inválido`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [data, rules, validateField]);

  const setFieldValue = useCallback((name: string, value: any) => {
    setData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field when touched
    const error = validateField(name, data[name]);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  }, [data, validateField]);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const getFieldError = useCallback((name: string): string | null => {
    return touched[name] ? errors[name] || null : null;
  }, [errors, touched]);

  return {
    data,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateForm,
    resetForm,
    getFieldError,
    isValid: Object.keys(errors).length === 0 || Object.values(errors).every(error => !error)
  };
};

// Validation rules comunes
export const commonValidations = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    min: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
  apiKey: {
    required: true,
    min: 10,
    pattern: /^[A-Za-z0-9]+$/,
  },
  quantity: {
    required: true,
    min: 0.001,
    max: 1000000,
  },
  price: {
    required: true,
    min: 0.000001,
    max: 1000000,
  },
  percentage: {
    required: true,
    min: 0,
    max: 100,
  },
};



