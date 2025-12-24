import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loginApi, adminLoginApi, registerApi, adminRegisterApi, getMyProfile, updateMyProfile } from '../api/auth';
import type { LoginRequest, RegisterRequest, AdminLoginRequest, AdminRegisterRequest, UserProfileResponse, LoginResponse } from '../api/auth';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginRequest) => loginApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useAdminLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminLoginRequest) => adminLoginApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => registerApi(payload),
  });
};

export const useAdminRegister = () => {
  return useMutation({
    mutationFn: (payload: AdminRegisterRequest) => adminRegisterApi(payload),
  });
};

export const useUserProfile = (enabled = true) => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => getMyProfile(),
    enabled,
    retry: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof updateMyProfile>[0]) => updateMyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
};

export const useInvalidateUser = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['user'] });
};
