export interface User {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

export interface Auth {
  token: string;
  user: User;
}