'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import DatabaseInitializer from '@/components/DatabaseInitializer';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only run this check on the client side
  if (isClient) {
    // Let's check if we're on the login page, which shouldn't have the admin dashboard layout
    const isLoginPage = pathname === '/admin';
    
    if (isLoginPage) {
      return (
        <>
          <DatabaseInitializer />
          {children}
        </>
      );
    }
  }

  return (
    <AuthProvider>
      {/* Admin pages don't show the regular site header/footer */}
      <DatabaseInitializer />
      {children}
    </AuthProvider>
  );
} 