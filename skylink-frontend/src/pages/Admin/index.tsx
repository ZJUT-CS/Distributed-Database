import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../../features/admin/components/Sidebar';
import TopHeader from '../../features/admin/components/TopHeader';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { ConfirmProvider } from '../../features/admin';

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const [showTopHeader, setShowTopHeader] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        // Show header only when at the very top (scrolled less than 20px)
        setShowTopHeader(scrollRef.current.scrollTop < 20);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        <Sidebar />
        <TopHeader isVisible={showTopHeader} />
        <div
          ref={scrollRef}
          className="flex-1 ml-64 p-8 overflow-y-auto h-screen scroll-smooth custom-scrollbar"
          style={{ paddingTop: '6rem' }}
        >
          <Outlet />
        </div>
      </div>
    </ConfirmProvider>
  );
};
export default AdminLayout;

