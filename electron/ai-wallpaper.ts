import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export type GenerateAiWallpaperPayload = {
  prompt: string
  size?: string
}

export type AiWallpaperConfig = {
  apiBaseUrl: string
  apiKey: string
  model: string
}

type ImageOutputFormat = 'png' | 'jpeg' | 'webp'

type GenerateAiWallpaperResult = {
  outputFormat: ImageOutputFormat
  path: string
  quality: string
  revisedPrompt?: string
  size: string
  usage?: Record<string, unknown>
}

function getWallpaperDirectory() {
  return path.join(os.homedir(), 'wallpaper-box')
}

function normalizeBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.replace(/\/+$/, '')
}

function buildImagesGenerationUrl(apiBaseUrl: string) {
  const normalized = normalizeBaseUrl(apiBaseUrl)
  return normalized.endsWith('/images/generations') ? normalized : `${normalized}/images/generations`
}

function isGptImageModel(model: string) {
  return /^gpt-image/i.test(model.trim())
}

function isGlmImageModel(model: string) {
  return /^glm-image/i.test(model.trim())
}

function getDefaultGenerationSize(model: string) {
  if (isGlmImageModel(model)) {
    return '2048x1152'
  }

  return '1536x1024'
}

const gptAllowedSizes = new Set(['1536x1024', '1024x1024', '1024x1536'])

function parseSize(value: string) {
  const match = value.match(/^(\d{2,5})x(\d{2,5})$/)
  if (!match) {
    return null
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  }
}

function resolveRequestedSize(model: string, requestedSize?: string) {
  const normalized = requestedSize?.trim()
  if (!normalized) {
    return getDefaultGenerationSize(model)
  }

  if (isGlmImageModel(model)) {
    const parsed = parseSize(normalized)
    if (!parsed) {
      throw new Error('尺寸格式无效，请使用 宽x高，例如 2048x1152')
    }

    const validDimensions = [parsed.width, parsed.height].every((value) => value >= 512 && value <= 2048 && value % 32 === 0)
    if (!validDimensions) {
      throw new Error('自定义宽高需在 512-2048 之间，且都为 32 的整数倍')
    }

    return normalized
  }

  if (isGptImageModel(model) && !gptAllowedSizes.has(normalized)) {
    throw new Error('当前模型暂不支持自定义宽高，请使用预设分辨率')
  }

  return normalized
}

function toSafeFileName(prompt: string) {
  const slug = prompt
    .trim()
    .slice(0, 36)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'ai-wallpaper'
}

async function fetchAsBuffer(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载生成图片失败：${response.status} ${response.statusText}`)
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || '',
  }
}

function resolveOutputFormat(model: string, requestedFormat?: string, fallbackFormat?: string) {
  if (fallbackFormat) {
    return fallbackFormat as ImageOutputFormat
  }

  if (isGptImageModel(model)) {
    return (requestedFormat || 'png') as ImageOutputFormat
  }

  return 'png'
}

function detectOutputFormatFromUrl(url: string, contentType?: string) {
  const normalizedContentType = contentType || ''

  if (normalizedContentType.includes('image/jpeg')) return 'jpeg'
  if (normalizedContentType.includes('image/webp')) return 'webp'
  if (normalizedContentType.includes('image/png')) return 'png'

  try {
    const pathname = new URL(url).pathname.toLowerCase()
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'jpeg'
    if (pathname.endsWith('.webp')) return 'webp'
    if (pathname.endsWith('.png')) return 'png'
  } catch {}

  return undefined
}

function buildRequestBody(model: string, payload: GenerateAiWallpaperPayload) {
  const size = resolveRequestedSize(model, payload.size)
  const body: Record<string, unknown> = {
    model,
    prompt: payload.prompt.trim(),
    size,
  }

  if (isGptImageModel(model)) {
    body.n = 1
    body.quality = 'auto'
    body.output_format = 'png'
    return body
  }

  if (!isGlmImageModel(model)) {
    body.n = 1
    body.response_format = 'b64_json'
  }

  return body
}

export async function generateAiWallpaper(config: AiWallpaperConfig, payload: GenerateAiWallpaperPayload): Promise<GenerateAiWallpaperResult> {
  if (!payload.prompt?.trim()) {
    throw new Error('请输入提示词')
  }

  if (!config.apiKey?.trim()) {
    throw new Error('请先在设置页填写 AI API Key')
  }

  if (!config.apiBaseUrl?.trim()) {
    throw new Error('请先在设置页填写 AI API Base URL')
  }

  if (!config.model?.trim()) {
    throw new Error('请先在设置页填写图片生成模型')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 180_000)

  try {
    const response = await fetch(buildImagesGenerationUrl(config.apiBaseUrl), {
      body: JSON.stringify(buildRequestBody(config.model, payload)),
      headers: {
        Authorization: `Bearer ${config.apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    })

    const raw = await response.text()
    const data = raw ? JSON.parse(raw) : {}

    if (!response.ok) {
      const message = data?.error?.message || data?.message || `图片生成失败：${response.status} ${response.statusText}`
      throw new Error(message)
    }

    const generated = data?.data?.[0]
    if (!generated) {
      throw new Error('模型没有返回图片结果')
    }

    let buffer: Buffer
    let detectedOutputFormat: ImageOutputFormat | undefined
    if (generated.b64_json) {
      buffer = Buffer.from(generated.b64_json, 'base64')
    } else if (generated.url) {
      const downloaded = await fetchAsBuffer(generated.url)
      buffer = downloaded.buffer
      detectedOutputFormat = detectOutputFormatFromUrl(generated.url, downloaded.contentType)
    } else {
      throw new Error('模型返回的图片数据格式暂不支持')
    }

    const outputFormat = resolveOutputFormat(config.model, data?.output_format, detectedOutputFormat)
    const wallpaperDirectory = getWallpaperDirectory()
    await fs.mkdir(wallpaperDirectory, { recursive: true })

    const fileName = `${Date.now()}-${toSafeFileName(payload.prompt)}.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`
    const filePath = path.join(wallpaperDirectory, fileName)

    await fs.writeFile(filePath, buffer)

    return {
      outputFormat,
      path: filePath,
      quality: isGptImageModel(config.model) ? data?.quality || 'auto' : data?.quality || '模型默认',
      revisedPrompt: generated?.revised_prompt,
      size: data?.size || resolveRequestedSize(config.model, payload.size),
      usage: data?.usage,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('图片生成超时，请稍后重试')
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
