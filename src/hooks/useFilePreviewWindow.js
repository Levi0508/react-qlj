import { useState, useCallback } from 'react';
import { message } from 'antd';

const PREVIEW_WINDOW_NAME = 'ibcmFilePreview';
const PREVIEW_WINDOW_FEATURES =
  'width=1000,height=800,left=100,top=100,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes';

/**
 * 同步打开空白预览窗口。
 * 必须在用户点击手势回调中同步调用，否则会被浏览器拦截；
 * 使用具名窗口（不要用 _blank）才会弹出独立窗口而非新标签页，同名窗口会复用。
 */
export function openBlankPreviewWindow() {
  return window.open('', PREVIEW_WINDOW_NAME, PREVIEW_WINDOW_FEATURES);
}

/**
 * 将预览地址导航到已打开的窗口；无地址时关闭空白窗。
 * @returns {boolean} 是否成功打开预览
 */
export function navigatePreviewWindow(previewWindow, previewUrl) {
  if (previewUrl) {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = previewUrl;
    } else {
      // 空白窗口被拦截时，退回到直接打开
      window.open(previewUrl, PREVIEW_WINDOW_NAME, PREVIEW_WINDOW_FEATURES);
    }
    return true;
  }
  if (previewWindow && !previewWindow.closed) {
    previewWindow.close();
  }
  return false;
}

export function closePreviewWindow(previewWindow) {
  if (previewWindow && !previewWindow.closed) {
    previewWindow.close();
  }
}

/**
 * 非 Hook 场景（如 class 组件）：在独立窗口中预览。
 * getPreviewUrl 返回 previewUrl 字符串，失败返回 null/undefined。
 */
export async function previewInWindow(getPreviewUrl, options = {}) {
  const previewWindow = openBlankPreviewWindow();
  try {
    const previewUrl = await getPreviewUrl();
    if (!navigatePreviewWindow(previewWindow, previewUrl)) {
      message.error(options.unsupportedMessage || '当前文件类型不支持预览');
      return false;
    }
    return true;
  } catch (error) {
    closePreviewWindow(previewWindow);
    message.error(options.errorMessage || error?.message || '当前文件不支持预览');
    return false;
  }
}

/**
 * 文件预览 Hook：在独立浏览器窗口打开预览，并管理按文件维度的 loading。
 *
 * @example
 * const { previewLoading, handlePreview } = useFilePreviewWindow();
 * const onPreview = (file) => {
 *   handlePreview(file, async (f) => {
 *     const result = await services.previewFile({ id: f.id, ... });
 *     return result?.success && result?.data?.previewUrl ? result.data.previewUrl : null;
 *   });
 * };
 */
export default function useFilePreviewWindow() {
  const [previewLoading, setPreviewLoading] = useState({});

  const handlePreview = useCallback(async (file, getPreviewUrl, options = {}) => {
    const loadingKey = options.loadingKey ?? file?.id ?? 'default';
    setPreviewLoading((prev) => ({ ...prev, [loadingKey]: true }));

    const previewWindow = openBlankPreviewWindow();

    try {
      const previewUrl = await getPreviewUrl(file);
      if (!navigatePreviewWindow(previewWindow, previewUrl)) {
        message.error(options.unsupportedMessage || '当前文件类型不支持预览');
      }
    } catch (error) {
      closePreviewWindow(previewWindow);
      message.error(options.errorMessage || error?.message || '当前文件不支持预览');
    } finally {
      setPreviewLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  }, []);

  return { previewLoading, handlePreview };
}
