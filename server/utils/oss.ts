import { randomUUID } from 'node:crypto';
import path from 'node:path';
import OSS from 'ali-oss';

type OssEnv = {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint?: string;
  baseUrl?: string;
};

/**
 * 从环境变量读取 OSS 配置，并做必填校验。
 */
function getOssEnv(): OssEnv {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID?.trim() ?? '';
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET?.trim() ?? '';
  const bucket = process.env.OSS_BUCKET?.trim() ?? '';
  const region = process.env.OSS_REGION?.trim() ?? '';
  const endpoint = process.env.OSS_ENDPOINT?.trim() || undefined;
  const baseUrl = process.env.OSS_BASE_URL?.trim() || undefined;

  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    throw new Error('OSS 配置不完整，请检查 OSS_ACCESS_KEY_ID/OSS_ACCESS_KEY_SECRET/OSS_BUCKET/OSS_REGION');
  }

  return {
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
    endpoint,
    baseUrl,
  };
}

/**
 * 生成上传到 OSS 的对象路径，按日期分目录便于后续管理。
 */
function buildObjectKey(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safeExt = ext && ext.length <= 10 ? ext : '.bin';
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `uploads/photos/${yyyy}/${mm}/${dd}/${Date.now()}-${randomUUID()}${safeExt}`;
}

/**
 * 拼出可公开访问的资源 URL（优先使用 OSS_BASE_URL）。
 */
function resolvePublicUrl(input: {
  objectKey: string;
  uploadResultUrl?: string;
  bucket: string;
  region: string;
  baseUrl?: string;
}): string {
  if (input.baseUrl) {
    const base = input.baseUrl.replace(/\/+$/, '');
    return `${base}/${input.objectKey}`;
  }
  if (input.uploadResultUrl) {
    if (input.uploadResultUrl.startsWith('//')) {
      return `https:${input.uploadResultUrl}`;
    }
    return input.uploadResultUrl;
  }
  return `https://${input.bucket}.${input.region}.aliyuncs.com/${input.objectKey}`;
}

/**
 * 上传图片到阿里云 OSS，返回对象 key 和可访问 URL（数据库只存元数据）。
 */
export async function uploadPhotoToOss(file: File): Promise<{ objectKey: string; publicUrl: string }> {
  const config = getOssEnv();
  const objectKey = buildObjectKey(file.name);
  const client = new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    region: config.region,
    endpoint: config.endpoint,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await client.put(objectKey, buffer, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  return {
    objectKey,
    publicUrl: resolvePublicUrl({
      objectKey,
      uploadResultUrl: result.url,
      bucket: config.bucket,
      region: config.region,
      baseUrl: config.baseUrl,
    }),
  };
}
