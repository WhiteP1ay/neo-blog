/**
 * UserAgent解析结果
 */
export type ParsedUserAgent = {
  device: string; // 设备类型：PC / Android / iOS / 未知
  browser: string; // 浏览器：Chrome / Safari / Firefox / Edge / 微信浏览器 / 其他
  os: string; // 操作系统：Windows / macOS / Android / iOS / Linux
  isWeChat: boolean; // 是否微信浏览器
  readable: string; // 可读字符串，如 "iOS Safari (微信浏览器)" 或 "PC Chrome"
};

/**
 * 解析UserAgent字符串，返回可读的设备、浏览器、操作系统信息
 */
export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  if (!userAgent) {
    return {
      device: "未知",
      browser: "未知",
      os: "未知",
      isWeChat: false,
      readable: "未知",
    };
  }

  const ua = userAgent.toLowerCase();
  let device: string = "PC";
  let browser: string = "未知";
  let os: string = "未知";
  let isWeChat = false;

  // 检测微信浏览器（优先检测，因为微信浏览器的userAgent会包含其他浏览器信息）
  if (ua.includes("micromessenger")) {
    isWeChat = true;
    browser = "微信浏览器";
  }

  // 检测设备类型
  if (ua.includes("android")) {
    device = "Android";
    os = "Android";
    // 提取Android版本
    const androidMatch = ua.match(/android\s([\d.]+)/);
    if (androidMatch) {
      os = `Android ${androidMatch[1]}`;
    }
  } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    device = ua.includes("ipad") ? "iPad" : "iOS";
    os = "iOS";
    // 提取iOS版本
    const iosMatch = ua.match(/os\s([\d_]+)/);
    if (iosMatch) {
      os = `iOS ${iosMatch[1].replace(/_/g, ".")}`;
    }
  } else if (ua.includes("windows")) {
    device = "PC";
    os = "Windows";
    // 提取Windows版本
    if (ua.includes("windows nt 10.0")) {
      os = "Windows 10/11";
    } else if (ua.includes("windows nt 6.3")) {
      os = "Windows 8.1";
    } else if (ua.includes("windows nt 6.2")) {
      os = "Windows 8";
    } else if (ua.includes("windows nt 6.1")) {
      os = "Windows 7";
    }
  } else if (ua.includes("mac os x") || ua.includes("macintosh")) {
    device = "PC";
    os = "macOS";
    // 提取macOS版本
    const macMatch = ua.match(/mac os x\s([\d_]+)/);
    if (macMatch) {
      os = `macOS ${macMatch[1].replace(/_/g, ".")}`;
    }
  } else if (ua.includes("linux")) {
    device = "PC";
    os = "Linux";
  }

  // 检测浏览器（如果不是微信浏览器）
  if (!isWeChat) {
    if (ua.includes("edg/")) {
      browser = "Edge";
      // 提取Edge版本
      const edgeMatch = ua.match(/edg\/([\d.]+)/);
      if (edgeMatch) {
        browser = `Edge ${edgeMatch[1].split(".")[0]}`;
      }
    } else if (ua.includes("chrome") && !ua.includes("edg")) {
      browser = "Chrome";
      // 提取Chrome版本
      const chromeMatch = ua.match(/chrome\/([\d.]+)/);
      if (chromeMatch) {
        browser = `Chrome ${chromeMatch[1].split(".")[0]}`;
      }
    } else if (ua.includes("safari") && !ua.includes("chrome")) {
      browser = "Safari";
      // 提取Safari版本
      const safariMatch = ua.match(/version\/([\d.]+)/);
      if (safariMatch) {
        browser = `Safari ${safariMatch[1].split(".")[0]}`;
      }
    } else if (ua.includes("firefox")) {
      browser = "Firefox";
      // 提取Firefox版本
      const firefoxMatch = ua.match(/firefox\/([\d.]+)/);
      if (firefoxMatch) {
        browser = `Firefox ${firefoxMatch[1].split(".")[0]}`;
      }
    } else if (ua.includes("opera") || ua.includes("opr/")) {
      browser = "Opera";
      const operaMatch = ua.match(/(?:opera|opr)\/([\d.]+)/);
      if (operaMatch) {
        browser = `Opera ${operaMatch[1].split(".")[0]}`;
      }
    } else if (ua.includes("msie") || ua.includes("trident")) {
      browser = "IE";
    }
  }

  // 生成可读字符串
  let readable = "";
  if (isWeChat) {
    // 微信浏览器：显示为 "iOS 微信浏览器" 或 "Android 微信浏览器"
    readable = `${device} ${browser}`;
  } else if (device === "PC") {
    // PC设备：显示为 "macOS Chrome" 或 "Windows Chrome"
    readable = `${os} ${browser}`;
  } else {
    // 移动设备：显示为 "iOS Safari" 或 "Android Chrome"
    readable = `${device} ${browser}`;
  }

  return {
    device,
    browser,
    os,
    isWeChat,
    readable,
  };
}
