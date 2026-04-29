import OSS from 'ali-oss';
import { imageSize } from 'image-size';

export type OssUploadResult = {
  url: string;
  objectKey: string;
  size: number;
  mimeType: string;
  width: number | null;
  height: number | null;
};

type OssEnv = {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint: string | null;
  baseUrl: string | null;
};

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);

let cachedClient: OSS | null = null;
let cachedEnv: OssEnv | null = null;

/**
 * 读取并校验 OSS 相关环境变量，缺失时抛出明确错误。
 */
function getOssEnv(): OssEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const accessKeyId = process.env.OSS_ACCESS_KEY_ID?.trim() ?? '';
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET?.trim() ?? '';
  const bucket = process.env.OSS_BUCKET?.trim() ?? '';
  const rawRegion = process.env.OSS_REGION?.trim() ?? '';
  const rawEndpoint = process.env.OSS_ENDPOINT?.trim() ?? '';
  const baseUrl = process.env.OSS_BASE_URL?.trim() ?? '';

  if (!accessKeyId) {
    throw new Error('缺少环境变量 OSS_ACCESS_KEY_ID');
  }
  if (!accessKeySecret) {
    throw new Error('缺少环境变量 OSS_ACCESS_KEY_SECRET');
  }
  if (!bucket) {
    throw new Error('缺少环境变量 OSS_BUCKET');
  }
  if (!rawRegion) {
    throw new Error('缺少环境变量 OSS_REGION');
  }

  // 兼容用户填 cn-beijing；ali-oss 期望 oss-cn-beijing。
  const region = rawRegion.startsWith('oss-') ? rawRegion : `oss-${rawRegion}`;
  const endpoint = rawEndpoint
    ? rawEndpoint.startsWith('http://') || rawEndpoint.startsWith('https://')
      ? rawEndpoint
      : `https://${rawEndpoint}`
    : '';

  cachedEnv = {
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
    endpoint: endpoint || null,
    baseUrl: baseUrl || null,
  };
  return cachedEnv;
}

/**
 * 懒加载 OSS 客户端，避免重复初始化。
 */
function getOssClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getOssEnv();
  cachedClient = new OSS({
    accessKeyId: env.accessKeyId,
    accessKeySecret: env.accessKeySecret,
    bucket: env.bucket,
    region: env.region,
    endpoint: env.endpoint ?? undefined,
    secure: true,
  });
  return cachedClient;
}

/**
 * 构造对外访问 URL，优先使用 OSS_BASE_URL。
 */
function buildPublicUrl(objectKey: string, client: OSS, env: OssEnv): string {
  if (env.baseUrl) {
    return `${env.baseUrl.replace(/\/$/, '')}/${objectKey}`;
  }
  return client.signatureUrl(objectKey, { expires: 3600 * 24 * 3650 });
}

/**
 * 从 File 中解析像素宽高，解析失败时返回 null。
 */
async function resolveImageDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const size = imageSize(Buffer.from(arrayBuffer));
    return {
      width: size.width ?? null,
      height: size.height ?? null,
    };
  } catch {
    return { width: null, height: null };
  }
}

/**
 * 上传图片到 OSS 并返回完整元信息。
 */
export async function uploadImageToOss(file: File, folder = 'photos'): Promise<OssUploadResult> {
  if (!(file instanceof File)) {
    throw new Error('上传文件无效');
  }
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式');
  }
  if (file.size <= 0) {
    throw new Error('上传文件为空');
  }

  const client = getOssClient();
  const env = getOssEnv();
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '.bin';
  const random = Math.random().toString(36).slice(2, 10);
  const safeFolder = folder.replace(/^\/+|\/+$/g, '') || 'photos';
  const objectKey = `${safeFolder}/${yyyy}/${mm}/${dd}/${Date.now()}-${random}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await client.put(objectKey, buffer, {
    mime: file.type,
  });

  const dimensions = await resolveImageDimensions(file);
  return {
    url: buildPublicUrl(objectKey, client, env),
    objectKey,
    size: file.size,
    mimeType: file.type,
    width: dimensions.width,
    height: dimensions.height,
  };
}
