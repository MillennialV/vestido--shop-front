// src/services/authService.ts

// Tipos para las respuestas de autenticación
interface User {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: AuthResponse;
}

// Cargar URL desde variables de entorno de Vite
const VITE_AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'https://auth-millennial.iaimpacto.com';

class AuthService {
  // Login con email y contraseña
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${VITE_AUTH_SERVICE_URL}/api/auth/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log('🌐 Respuesta completa de la API:', data);

      if (data.success && data.data) {
        // Guardar token y usuario
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return data.data;
      } else {
        throw new Error(data.message || 'Error en el login');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Registro de nuevo usuario
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${VITE_AUTH_SERVICE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return data.data;
      } else {
        throw new Error(data.message || 'Error en el registro');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  // Obtener token guardado
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Obtener usuario guardado
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Logout
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

// Exportar instancia única
export default new AuthService();

