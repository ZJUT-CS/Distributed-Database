import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm, useAuth, PageLayout, type User } from '@/features/auth';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (user: User, token?: string) => {
    login(user, token ?? '');
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
    <PageLayout>
      <LoginForm onLogin={handleLogin} onCancel={handleCancel} />
    </PageLayout>
  );
};

export default LoginPage;
