'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { googleLogin } = useAuth();
  const hasAttemptedLogin = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasAttemptedLogin.current) return;

    const token = searchParams.get('token');
    const errCode = searchParams.get('error');

    if (errCode) {
      setError(decodeURIComponent(errCode));
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    if (!token) {
      setError('No se encontró el token de autenticación.');
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    hasAttemptedLogin.current = true;

    const completeLogin = async () => {
      try {
        await googleLogin(token);
        // googleLogin en AuthProvider manejará la redirección final
      } catch (err: any) {
        setError(err.message || 'Error en validación');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    completeLogin();
  }, [searchParams, router, googleLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900 dark:border-white mb-4"></div>
      <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200">
        {error ? 'Error en la autenticación' : 'Verificando tu cuenta...'}
      </h2>
      <p className="text-stone-500 dark:text-stone-400 text-sm mt-2">
        {error ? `${error}. Redirigiendo...` : 'Por favor espera un momento mientras validamos tu sesión.'}
      </p>
    </div>
  );
}
