import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../../components/user/UserProfile';
import { useAuth } from '../../hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <UserProfile user={user} onBack={() => navigate('/')} />
  );
};

export default ProfilePage;
