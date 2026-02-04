import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../context/AuthContext';

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (!context) {
        // Retornar un valor por defecto en SSR o cuando no haya AuthProvider
        return {
            authenticated: false,
            onLogin: async () => { throw new Error('AuthProvider no disponible'); },
            onLogout: async () => { throw new Error('AuthProvider no disponible'); },
        };
    }

    return context;
};