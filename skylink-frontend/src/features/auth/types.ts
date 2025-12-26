export interface User {
  id?: number | string;
  username: string;
  email?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  realName?: string;
  idCard?: string;
  gender?: 0 | 1 | 2;
  createdAt?: string;
  role: 'user' | 'admin';
  adminRole?: number | string;
}

