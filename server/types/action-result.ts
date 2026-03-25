/**
 * Server Action 统一返回：成功带 data，失败带 error（便于调用方收窄类型）
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** 无业务载荷的成功（删除、仅状态成功等） */
export type ActionVoidResult =
  | { success: true }
  | { success: false; error: string };

export function actionOk<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

export function actionOkVoid(): { success: true } {
  return { success: true };
}

export function actionErr(error: string): { success: false; error: string } {
  return { success: false, error };
}
