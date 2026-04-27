import { http } from "./http";

export type AuthResult = {
  userId: string;
  username: string;
  isNewUser: boolean;
};

export const authService = {
  register: (username: string, password: string, phone: string, code: string, createCoachPlaceholder = false) =>
    http<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, phone, code, createCoachPlaceholder }),
    }),
  login: (username: string, password: string) =>
    http<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  sendPhoneCode: (phone: string) =>
    http<{ ok: boolean; code: string }>("/auth/phone/send-code", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  loginByPhone: (phone: string, code: string) =>
    http<AuthResult>("/auth/phone/login", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    http<{ ok: boolean }>("/user/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    }),
  deleteAccount: (confirmText: string) =>
    http<{ ok: boolean }>("/user/account", {
      method: "DELETE",
      body: JSON.stringify({ confirmText }),
    }),
};
