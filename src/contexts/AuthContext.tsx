
import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import users from '../data/users.json';

interface User {
  username: string;
  role: 'seeker' | 'poster';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        const userData = { username: foundUser.username, role: foundUser.role as 'seeker' | 'poster' };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        resolve(userData);
      } else {
        reject(new Error('Invalid username or password'));
      }
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
