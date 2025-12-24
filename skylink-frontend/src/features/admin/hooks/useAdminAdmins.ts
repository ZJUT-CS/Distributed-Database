import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAdminsPage, createAdmin, deleteAdmin, resetAdminPassword, listSystemLogs } from '../api/admins';
import type { AdminItem, CreateAdminRequest, SystemLogItem } from '../api/admins';

export const useAdmins = (params: {
  keyword?: string;
  page: number;
  size: number;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'admins', params],
    queryFn: () => listAdminsPage(params),
    enabled,
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateAdminRequest) => createAdmin(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adminId: string) => deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

export const useResetAdminPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, newPassword }: { adminId: string; newPassword: string }) => 
      resetAdminPassword(adminId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
  });
};

export const useSystemLogs = (params: {
  keyword?: string;
  module?: string;
  operResult?: number;
  page?: number;
  size?: number;
}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'systemLogs', params],
    queryFn: () => listSystemLogs(params),
    enabled,
  });
};

export const useInvalidateAdmins = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
};
