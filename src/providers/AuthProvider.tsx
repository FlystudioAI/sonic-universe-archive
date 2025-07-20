import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '@/auth/authService';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  authService: AuthService;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authService] = useState(new AuthService());

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = authService.constructor.prototype.onAuthStateChanged?.(() => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [authService]);

  const signIn = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const user = await authService.signIn(email, password);
      setUser(user);
      return user;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    setIsLoading(true);
    try {
      const user = await authService.signUp(email, password, displayName);
      setUser(user);
      return user;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    setIsLoading(true);
    try {
      const user = await authService.signInWithGoogle();
      setUser(user);
      return user;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    authService
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};