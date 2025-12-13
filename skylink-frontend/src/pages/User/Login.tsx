import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/user/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { User } from '../../types';

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
    <div className="pt-20">
      <LoginForm onLogin={handleLogin} onCancel={handleCancel} />
    </div>
  );
};

export default LoginPage;
