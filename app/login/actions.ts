"use server";

import { verifyPassword, createSession, clearSession, getSession } from "@/server/utils/auth";
import { redirect } from "next/navigation";

/**
 * Server Action: 用户登录
 * 
 * @param username - 用户名
 * @param password - 密码
 * @returns 登录结果
 */
export async function login(username: string, password: string) {
  try {
    if (!username || !password) {
      return { success: false, error: "请填写用户名和密码" };
    }

    const userId = await verifyPassword(username, password);
    if (!userId) {
      return { success: false, error: "用户名或密码错误" };
    }

    // 创建session
    await createSession(userId);
    
    return { success: true };
  } catch (error) {
    console.error("登录失败:", error);
    return { success: false, error: "登录失败" };
  }
}

/**
 * Server Action: 用户登出
 */
export async function logout() {
  await clearSession();
  redirect("/login");
}

/**
 * Server Action: 检查是否已登录
 */
export async function checkAuth() {
  const userId = await getSession();
  return { success: userId !== null, userId };
}

