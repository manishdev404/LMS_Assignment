'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/context/auth-context';
import { ApiError, errorMessage } from '@/lib/api';
import { navigateWithNewSession } from '@/lib/navigation';

interface FormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 2) errors.name = 'Enter your name';
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address';
  if (values.password.length < 8) errors.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password))
    errors.password = 'Include at least one letter and one number';
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function RegisterForm() {
  const { register } = useAuth();
  const [values, setValues] = useState<FormValues>({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      navigateWithNewSession('/apply');
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
      } else {
        setFormError(errorMessage(err));
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field id="name" label="Full name" error={errors.name}>
        <Input id="name" autoComplete="name" value={values.name} onChange={update('name')} invalid={!!errors.name} />
      </Field>
      <Field id="email" label="Email" error={errors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update('email')}
          invalid={!!errors.email}
        />
      </Field>
      <Field id="password" label="Password" hint="At least 8 characters with a letter and a number" error={errors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={update('password')}
          invalid={!!errors.password}
        />
      </Field>
      <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={update('confirmPassword')}
          invalid={!!errors.confirmPassword}
        />
      </Field>
      <Button type="submit" className="w-full" loading={submitting}>
        Create account
      </Button>
    </form>
  );
}
