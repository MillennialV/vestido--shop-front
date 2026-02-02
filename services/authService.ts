import { Auth } from "../types/auth";
import { VITE_AUTH_SERVICE_URL } from "../core/apiConfig";

class AuthService {
  async login(email: string, password: string): Promise<Auth> {
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

      const json = await response.json();

      if (json.success && json.data) {
        localStorage.setItem('authToken', json.data.token);
        localStorage.setItem('user', JSON.stringify(json.data.user));
        return { token: json.data.token, user: json.data.user };
      } else {
        throw new Error(json.error || 'Error en el login');
      }
    } catch (error) {
      throw new Error(error || 'Error en el login');
    }
  }

  async register(email: string, password: string, name: string): Promise<Auth> {
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

      const json = await response.json();

      if (json.success && json.data) {
        localStorage.setItem('authToken', json.data.token);
        localStorage.setItem('user', JSON.stringify(json.data.user));
        return { token: json.data.token, user: json.data.user };
      } else {
        throw new Error(json.error || 'Error en el registro');
      }
    } catch (error) {
      throw new Error(error || 'Error en el registro');
    }
  }
}

// Exportar instancia única
export default new AuthService();

