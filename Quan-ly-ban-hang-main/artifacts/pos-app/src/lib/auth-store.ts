import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export type UserRole = "admin" | "sales" | "warehouse" | "accountant";
export type StaffRole = "sales" | "warehouse" | "accountant";

export interface User {
  id: string;
  email: string;
  name: string;
  shopName: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
  role?: UserRole;
  ownerId?: string;
  shopId?: string;
  isActive?: boolean;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  shopName: string;
  phone: string;
  role: UserRole;
  ownerId?: string;
  shopId: string;
}

interface AuthState {
  users: User[];
  session: Session | null;
  register: (data: {
    email: string;
    name: string;
    shopName: string;
    phone: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string; shopId?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, "name" | "shopName" | "phone">>) => void;
  addStaff: (data: {
    email: string;
    name: string;
    phone: string;
    role: StaffRole;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateStaff: (
    id: string,
    data: Partial<Pick<User, "name" | "phone" | "role" | "isActive">> & { password?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteStaff: (id: string) => Promise<{ success: boolean; error?: string }>;
  getShopStaff: (shopId: string) => User[];
}

async function hashPassword(password: string, userId: string): Promise<string> {
  const data = new TextEncoder().encode(password + userId + "qlbh-secure-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildSession(user: User): Session {
  const shopId = user.shopId || user.ownerId || user.id;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    shopName: user.shopName,
    phone: user.phone,
    role: user.role || "admin",
    ownerId: user.ownerId,
    shopId,
  };
}

function isShopAdmin(session: Session | null): session is Session {
  return !!session && session.role === "admin";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      session: null,

      register: async ({ email, name, shopName, phone, password }) => {
        const normalized = email.toLowerCase().trim();

        if (!normalized || !name || !password || !shopName) {
          return { success: false, error: "Vui lòng điền đầy đủ thông tin bắt buộc" };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalized)) {
          return { success: false, error: "Địa chỉ email không hợp lệ" };
        }

        if (password.length < 6) {
          return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
        }

        const existing = get().users.find((u) => u.email === normalized);
        if (existing) {
          return { success: false, error: "Email này đã được đăng ký. Vui lòng đăng nhập." };
        }

        const id = uuidv4();
        const passwordHash = await hashPassword(password, id);

        const newUser: User = {
          id,
          email: normalized,
          name: name.trim(),
          shopName: shopName.trim(),
          phone: phone.trim(),
          passwordHash,
          createdAt: new Date().toISOString(),
          role: "admin",
          shopId: id,
          isActive: true,
        };

        const session = buildSession(newUser);

        set((state) => ({ users: [...state.users, newUser], session }));
        return { success: true, shopId: id };
      },

      login: async (email, password) => {
        const normalized = email.toLowerCase().trim();
        const user = get().users.find((u) => u.email === normalized);

        if (!user) {
          return { success: false, error: "Email không tồn tại. Vui lòng đăng ký tài khoản mới." };
        }

        if (user.isActive === false) {
          return { success: false, error: "Tài khoản đã bị vô hiệu hóa. Liên hệ chủ cửa hàng." };
        }

        const hash = await hashPassword(password, user.id);
        if (hash !== user.passwordHash) {
          return { success: false, error: "Mật khẩu không đúng. Vui lòng thử lại." };
        }

        set({ session: buildSession(user) });
        return { success: true };
      },

      logout: () => {
        set({ session: null });
      },

      updateProfile: (data) => {
        const { session, users } = get();
        if (!session) return;

        const updatedUsers = users.map((u) => {
          if (u.id === session.userId) return { ...u, ...data };
          if (u.ownerId === session.userId && data.shopName) {
            return { ...u, shopName: data.shopName };
          }
          return u;
        });

        const updatedSession = { ...session, ...data };
        set({ users: updatedUsers, session: updatedSession });
      },

      addStaff: async ({ email, name, phone, role, password }) => {
        const normalized = email.toLowerCase().trim();
        const { session } = get();
        if (!isShopAdmin(session)) {
          return { success: false, error: "Chỉ chủ cửa hàng mới có quyền thêm nhân viên" };
        }

        if (!normalized || !name) {
          return { success: false, error: "Họ tên và Email nhân viên là bắt buộc" };
        }

        if (!password || password.length < 6) {
          return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalized)) {
          return { success: false, error: "Địa chỉ email không hợp lệ" };
        }

        const existing = get().users.find((u) => u.email === normalized);
        if (existing) {
          return { success: false, error: "Email này đã được sử dụng bởi người dùng khác." };
        }

        const id = uuidv4();
        const passwordHash = await hashPassword(password, id);

        const newUser: User = {
          id,
          email: normalized,
          name: name.trim(),
          shopName: session.shopName,
          phone: phone.trim(),
          passwordHash,
          createdAt: new Date().toISOString(),
          role,
          ownerId: session.userId,
          shopId: session.shopId,
          isActive: true,
        };

        set((state) => ({ users: [...state.users, newUser] }));
        return { success: true };
      },

      updateStaff: async (id, data) => {
        const { session, users } = get();
        if (!isShopAdmin(session)) {
          return { success: false, error: "Chỉ chủ cửa hàng mới có quyền sửa nhân viên" };
        }

        const userIndex = users.findIndex((u) => u.id === id);
        if (userIndex === -1) {
          return { success: false, error: "Không tìm thấy thông tin nhân viên" };
        }

        const target = users[userIndex];
        if (target.ownerId !== session.userId) {
          return { success: false, error: "Bạn chỉ có thể sửa nhân viên thuộc cửa hàng của mình" };
        }

        const updatedUsers = [...users];
        const userToUpdate = { ...updatedUsers[userIndex] };

        if (data.name !== undefined) userToUpdate.name = data.name.trim();
        if (data.phone !== undefined) userToUpdate.phone = data.phone.trim();
        if (data.role !== undefined) userToUpdate.role = data.role;
        if (data.isActive !== undefined) userToUpdate.isActive = data.isActive;

        if (data.password) {
          if (data.password.length < 6) {
            return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
          }
          userToUpdate.passwordHash = await hashPassword(data.password, id);
        }

        updatedUsers[userIndex] = userToUpdate;
        set({ users: updatedUsers });
        return { success: true };
      },

      deleteStaff: async (id) => {
        const { session, users } = get();
        if (!isShopAdmin(session)) {
          return { success: false, error: "Chỉ chủ cửa hàng mới có quyền xóa nhân viên" };
        }

        const target = users.find((u) => u.id === id);
        if (!target) {
          return { success: false, error: "Không tìm thấy nhân viên" };
        }

        if (target.ownerId !== session.userId) {
          return { success: false, error: "Bạn chỉ có thể xóa nhân viên thuộc cửa hàng của mình" };
        }

        set({ users: users.filter((u) => u.id !== id) });
        return { success: true };
      },

      getShopStaff: (shopId) => {
        return get().users.filter((u) => u.shopId === shopId && u.ownerId);
      },
    }),
    {
      name: "qlbh-auth",
      partialize: (state) => ({ users: state.users, session: state.session }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AuthState>;
        const users = (saved.users ?? []).map((user) => ({
          ...user,
          shopId: user.shopId || user.ownerId || user.id,
          isActive: user.isActive ?? true,
        }));

        const session = saved.session
          ? {
              ...saved.session,
              shopId: saved.session.shopId || saved.session.ownerId || saved.session.userId,
              role: saved.session.role || "admin",
            }
          : null;

        return { ...current, users, session };
      },
    }
  )
);
