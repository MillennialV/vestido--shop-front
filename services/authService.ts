import { Auth } from "../types/auth";
import { VITE_AUTH_SERVICE_URL } from "../core/apiConfig";

class AuthService {
  async login(email: string, password: string): Promise<Auth> {
    console.log('[AuthService] Iniciando login para:', email);
    console.log('[AuthService] URL de auth:', VITE_AUTH_SERVICE_URL);
    try {
      const url = `${VITE_AUTH_SERVICE_URL}/api/auth/email`;
      console.log('[AuthService] Haciendo fetch a:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[AuthService] Respuesta recibida, status:', response.status);

      if (!response.ok) {
        console.error('[AuthService] Response no OK:', response.statusText);
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const json = await response.json();
      console.log('[AuthService] JSON parseado:', { success: json.success, hasData: !!json.data });

      if (json.success && json.data) {
        console.log('[AuthService] Login exitoso, guardando token');
        localStorage.setItem('authToken', json.data.token);
        localStorage.setItem('user', JSON.stringify(json.data.user));
        console.log('[AuthService] Datos guardados, retornando Auth');
        return { token: json.data.token, user: json.data.user };
      } else {
        const errorMsg = json.error || 'Error en el login';
        console.error('[AuthService] Login no exitoso:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('[AuthService] Error capturado:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`[AuthService] ${message}`);
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

