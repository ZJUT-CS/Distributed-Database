export type NormalizedUserRole = 'user' | 'admin';

export const TOKEN_KEY = 'skylink_token';
export const USER_KEY = 'skylink_user';

export const normalizeUserRole = (role: unknown): NormalizedUserRole => {
  if (role === 2 || role === '2') return 'admin';
  const r = String(role ?? '').trim().toLowerCase();
  return r.includes('admin') ? 'admin' : 'user';
};

const safeParseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export const readStoredToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token && token.trim() !== '' ? token : null;
  } catch {
    return null;
  }
};

export const readStoredUserRaw = (): unknown | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = safeParseJson(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export interface StoredUserHeaderInfo {
  id?: string | number;
  role?: NormalizedUserRole;
  adminRole?: string;
}

export const readStoredUserHeaderInfo = (): StoredUserHeaderInfo | null => {
  const parsed = readStoredUserRaw() as any;
  if (!parsed) return null;

  const id = parsed.id ?? parsed.userId ?? parsed.adminId;
  const role = normalizeUserRole(parsed.role);
  const adminRoleRaw = parsed.adminRole ?? parsed.admin_role ?? parsed.roleId ?? parsed.role_id;
  const adminRole = adminRoleRaw == null ? undefined : String(adminRoleRaw).trim();

  return { id, role, adminRole };
};

export const clearStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
  }
};
