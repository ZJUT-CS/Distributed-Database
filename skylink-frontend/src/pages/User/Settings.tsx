import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserSettings from '../../components/user/UserSettings';
import { useAuth } from '../../hooks/useAuth';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <UserSettings onBack={() => navigate('/')} />
  );
};

export default SettingsPage;
