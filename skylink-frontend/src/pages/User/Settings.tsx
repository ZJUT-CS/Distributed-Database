import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/user-center?tab=security" replace />;
};

export default SettingsPage;
