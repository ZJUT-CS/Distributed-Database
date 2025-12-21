import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/user-center?tab=profile" replace />;
};

export default ProfilePage;
