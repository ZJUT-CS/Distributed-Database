import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../features/auth/components/LoginForm';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { User } from '../../types';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (user: User) => {
    login(user);
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/'); 
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <LoginForm onLogin={handleLogin} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default LoginPage;
