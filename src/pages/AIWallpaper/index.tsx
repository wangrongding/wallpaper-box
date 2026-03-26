import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ipcRenderer } from 'electron'
import { FolderOpen, ImagePlus, Maximize2, RefreshCw, Settings2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const Store = require('electron-store')
const store = new Store()

const defaultAiConfig = {
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-image-1',
}

const gptGenerationSizePresets = [
  { value: '1536x1024', label: '横向 1536x1024' },
  { value: '1024x1024', label: '方图 1024x1024' },
  { value: '1024x1536', label: '竖图 1024x1536' },
]

const glmGenerationSizePresets = [
  { value: '2048x1152', label: '16:9 2048x1152' },
  { value: '2048x1280', label: '16:10 2048x1280' },
  { value: '2048x864', label: '21:9 2048x864' },
  { value: '1792x1024', label: '宽屏 1792x1024' },
  { value: '1536x1536', label: '方图 1536x1536' },
  { value: '1152x2048', label: '竖图 1152x2048' },
]

const promptPresets = [
  {
    label: '午夜东京',
    prompt: '午夜东京高架桥与街道，雨后路面有霓虹倒影，电影感长焦构图，黑青冷色调，层次清晰，适合作为宽屏桌面壁纸，无人物无文字无水印',
  },
  {
    label: '雾海群山',
    prompt: '东方山脉与云海，清晨薄雾，远近层次分明，大面积留白，极简而高级，适合作为桌面壁纸，无人物无文字',
  },
  {
    label: '玻璃流体',
    prompt: '抽象玻璃与液态金属结构，透明材质与流动高光，蓝金渐变，干净现代，高级科技感，适合作为桌面壁纸，无文字',
  },
  {
    label: '天空之城',
    prompt: '幻想系天空之城与漂浮建筑，云海翻涌，日光穿透云层，明亮通透，动画电影质感，适合作为桌面背景，无角色特写无文字',
  },
  {
    label: '深空星港',
    prompt: '深空轨道上的未来星港与行星弧面，宇宙尘埃和冷光结构，宏大但干净，沉浸感强，适合作为宽屏桌面壁纸，无文字',
  },
  {
    label: '黑金纹理',
    prompt: '黑金配色的抽象纹理与金属光泽，质感细腻，对比克制，成熟高级，适合作为极简风桌面壁纸，无文字无Logo',
  },
  {
    label: '雪原极光',
    prompt: '极夜雪原与天空极光，蓝绿色光带横贯天幕，冰面反射柔和光泽，空气清冷通透，纯净宽屏构图，适合作为桌面壁纸，无人物无文字',
  },
  {
    label: '海岸日落',
    prompt: '黄昏海岸线与礁石，橙金日落映照海面，层云细腻，电影感广角构图，温暖但克制，适合作为宽屏桌面壁纸，无人物无文字',
  },
  {
    label: '未来中庭',
    prompt: '未来感建筑中庭，巨型玻璃穹顶与白色结构线条，晨光洒落，空间干净通透，高级建筑摄影质感，适合作为桌面壁纸，无人物无文字',
  },
  {
    label: '复古机甲城',
    prompt: '复古未来主义机甲都市，巨型工业结构与暖色霓虹并存，空气中有薄雾，细节密集但画面整洁，适合作为宽屏桌面壁纸，无人物无文字',
  },
  {
    label: '湖畔木屋',
    prompt: '北欧湖畔木屋与松林，清晨薄雾漂浮在水面，冷暖平衡的自然光，安静治愈，高级摄影质感，适合作为桌面背景，无人物无文字',
  },
  {
    label: '赛博隧道',
    prompt: '未来感光轨隧道，线性透视极强，蓝紫冷光与金属反射，速度感和秩序感并存，干净现代，适合作为宽屏桌面壁纸，无文字',
  },
  {
    label: '水墨山城',
    prompt: '东方水墨意境山城，层叠屋檐与远山薄雾，灰青色调，留白构图，静谧克制，具有高级壁纸质感，无人物无文字',
  },
  {
    label: '月面基地',
    prompt: '月球基地与远方地球同框，灰白色月壤、低重力建筑和冷光舱体，画面干净开阔，科幻真实感强，适合作为宽屏桌面壁纸，无文字',
  },
  {
    label: '热带海湾',
    prompt: '俯瞰热带海湾与清澈海水，岛屿弧线优雅，阳光通透，白沙与海浪层次细腻，清爽高级，适合作为桌面壁纸，无人物无文字',
  },
  {
    label: '赤色峡谷',
    prompt: '巨型红色峡谷与蜿蜒河道，夕阳低角度光线拉出立体层次，画面宏大而干净，具有史诗感，适合作为宽屏桌面壁纸，无文字',
  },
  {
    label: '静物花影',
    prompt: '高级静物摄影风格的花影与玻璃器皿，柔和侧光，浅灰背景，构图克制优雅，适合作为简洁桌面壁纸，无人物无文字',
  },
  {
    label: '云端神殿',
    prompt: '悬浮在云端的古典神殿，金色晨光穿过云层，体积光明显，圣洁而宏伟，幻想电影海报质感，适合作为桌面壁纸，无人物无文字',
  },
]

const customSizeOption = { value: 'custom', label: '自定义宽高' }
const minimumGenerationLoadingMs = 50_000

type GenerateResult = {
  outputFormat?: string
  path?: string
  quality?: string
  revisedPrompt?: string
  size?: string
  success?: boolean
  usage?: Record<string, unknown>
}

function isGlmImageModel(model: string) {
  return /^glm-image/i.test(model.trim())
}

function readAiConfig() {
  return {
    apiBaseUrl: store.get('ai-api-base-url') || defaultAiConfig.apiBaseUrl,
    apiKey: store.get('ai-api-key') || '',
    model: store.get('ai-model') || defaultAiConfig.model,
  }
}

function saveAiConfig(config: typeof defaultAiConfig) {
  store.set('ai-api-base-url', config.apiBaseUrl.trim() || defaultAiConfig.apiBaseUrl)
  store.set('ai-api-key', config.apiKey.trim())
  store.set('ai-model', config.model.trim() || defaultAiConfig.model)
}

export default function AIWallpaper() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [previewToken, setPreviewToken] = useState<number>(Date.now())
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [aiConfig, setAiConfig] = useState(defaultAiConfig)
  const [size, setSize] = useState('1536x1024')
  const [customWidth, setCustomWidth] = useState('2048')
  const [customHeight, setCustomHeight] = useState('1152')
  const generationStartedAtRef = useRef(0)

  useEffect(() => {
    setAiConfig(readAiConfig())
  }, [])

  const usingGlmImage = isGlmImageModel(aiConfig.model)
  const generationSizeOptions = usingGlmImage ? [...glmGenerationSizePresets, customSizeOption] : gptGenerationSizePresets
  const defaultSize = generationSizeOptions[0]?.value || '1536x1024'
  const isCustomSize = size === 'custom'

  useEffect(() => {
    if (!generationSizeOptions.some((item) => item.value === size)) {
      setSize(defaultSize)
    }
  }, [defaultSize, generationSizeOptions, size])

  useEffect(() => {
    if (!isGenerating) {
      return
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - generationStartedAtRef.current
      const progressRatio = Math.min(elapsed / minimumGenerationLoadingMs, 1)
      const nextProgress = Math.min(92, Math.round(7 + progressRatio * 85))
      setGenerationProgress((current) => Math.max(current, nextProgress))
    }, 240)

    return () => clearInterval(timer)
  }, [isGenerating])

  const apiReady = Boolean(aiConfig.apiKey.trim())

  function resolveSizeForRequest() {
    if (!isCustomSize) {
      return size
    }

    if (!usingGlmImage) {
      throw new Error('当前模型暂不支持自定义宽高')
    }

    const width = Number(customWidth)
    const height = Number(customHeight)
    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      throw new Error('请填写整数宽高')
    }

    const validDimensions = [width, height].every((value) => value >= 512 && value <= 2048 && value % 32 === 0)
    if (!validDimensions) {
      throw new Error('宽高需在 512-2048 之间，且都为 32 的整数倍')
    }

    return `${width}x${height}`
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.warning('先写一句你想要的壁纸描述吧')
      return
    }

    if (!apiReady) {
      setIsConfigOpen(true)
      toast.warning('先配置文生图 API 才能开始生成')
      return
    }

    let resolvedSize = size
    try {
      resolvedSize = resolveSizeForRequest()
    } catch (error) {
      toast.warning(error instanceof Error ? error.message : '分辨率设置无效')
      return
    }

    generationStartedAtRef.current = Date.now()
    setIsGenerating(true)
    setGenerationProgress(7)
    setResult(null)

    try {
      const response = await ipcRenderer.invoke('generate-ai-wallpaper', {
        prompt,
        size: resolvedSize,
      })

      if (!response?.success) {
        toast.error(response?.message || '图片生成失败')
        return
      }

      const elapsed = Date.now() - generationStartedAtRef.current
      const remaining = Math.max(0, minimumGenerationLoadingMs - elapsed)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      setGenerationProgress(100)
      setResult(response)
      setPreviewToken(Date.now())
      toast.success('壁纸生成完成')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleApplyWallpaper() {
    if (!result?.path) return

    setIsApplying(true)

    try {
      const applyResult = await ipcRenderer.invoke('set-wallpaper', result.path)
      if (!applyResult?.success) {
        toast.error(applyResult?.message || '设置壁纸失败')
        return
      }

      ipcRenderer.send('close-live-wallpaper')
      toast.success('已设为桌面壁纸')
    } finally {
      setIsApplying(false)
    }
  }

  async function handleRevealInFinder() {
    if (!result?.path) return

    const response = await ipcRenderer.invoke('show-item-in-folder', result.path)
    if (!response?.success) {
      toast.error(response?.message || '打开文件位置失败')
    }
  }

  function handleSaveAiConfig() {
    saveAiConfig(aiConfig)
    setAiConfig(readAiConfig())
    setIsConfigOpen(false)
    toast.success('AI 配置已保存')
  }

  return (
    <div className='ai-wallpaper-page h-full overflow-hidden'>
      <div className='grid h-full grid-cols-[360px_minmax(0,1fr)] gap-4'>
        <section className='flex min-h-0 flex-col rounded-[14px] border border-white/10 bg-[linear-gradient(160deg,rgba(8,14,24,0.98),rgba(10,18,30,0.95))] p-4 shadow-[0_24px_60px_rgba(2,6,23,0.2)]'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <h1 className='font-display text-[24px] font-semibold text-white'>AI 壁纸</h1>
            <Button
              variant='outline'
              onClick={() => setIsConfigOpen(true)}
              className='h-10 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-white hover:bg-white/[0.08]'
            >
              <Settings2 className='mr-2 h-4 w-4' />
              设置
            </Button>
          </div>

          <div className='mb-4'>
            <p className='mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>Prompt</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='推荐写法：主体场景 + 风格质感 + 光线时间 + 镜头构图 + 壁纸要求。例：未来海岸线城市，黄昏逆光，电影感广角构图，干净留白，适合作为宽屏桌面壁纸，无人物无文字无水印。'
              className='h-[132px] w-full resize-none rounded-[20px] border border-white/10 bg-black/20 px-4 py-3.5 text-[14px] leading-6 text-white outline-none transition-all duration-200 placeholder:text-slate-400/75 focus:border-sky-400/30 focus:ring-2 focus:ring-sky-400/15'
            />
          </div>

          <div className='min-h-0'>
            <p className='mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>Quick Presets</p>
            <div className='flex flex-wrap gap-2'>
              {promptPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setPrompt(preset.prompt)}
                  className={cn(
                    'rounded-full border px-3.5 py-2 text-left text-[12px] font-medium transition-all duration-200',
                    prompt === preset.prompt
                      ? 'bg-sky-300/12 border-sky-300/35 text-white shadow-[0_10px_32px_rgba(56,189,248,0.12)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {isCustomSize && (
            <div className='my-4 rounded-[22px] border border-white/10 bg-black/20 p-3'>
              <div className='mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
                <Maximize2 className='h-3.5 w-3.5 text-sky-200' />
                自定义宽高
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='mb-2 text-[11px] font-medium text-slate-400'>宽度</p>
                  <Input
                    value={customWidth}
                    inputMode='numeric'
                    placeholder='2048'
                    onChange={(e) => setCustomWidth(e.target.value.replace(/[^\d]/g, ''))}
                    className='h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500'
                  />
                </div>
                <div>
                  <p className='mb-2 text-[11px] font-medium text-slate-400'>高度</p>
                  <Input
                    value={customHeight}
                    inputMode='numeric'
                    placeholder='1152'
                    onChange={(e) => setCustomHeight(e.target.value.replace(/[^\d]/g, ''))}
                    className='h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500'
                  />
                </div>
              </div>
              <p className='mt-3 text-[11px] leading-5 text-slate-500'>适用于 `glm-image`：范围 512-2048，且宽高都需为 32 的整数倍。</p>
            </div>
          )}

          <div className='mb-4 grid grid-cols-[1fr_auto] gap-3'>
            <div>
              <p className='mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>分辨率</p>
              <Select value={size} onValueChange={(value: string) => setSize(value)}>
                <SelectTrigger className='h-11 rounded-2xl border-white/10 bg-black/20 text-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generationSizeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-end'>
              <Button onClick={handleGenerate} loading={isGenerating} className='h-11 min-w-[136px] rounded-2xl px-4 text-[14px]'>
                {!isGenerating && <ImagePlus className='mr-2 h-4 w-4' />}
                生成壁纸
              </Button>
            </div>
          </div>
        </section>

        <section className='flex min-h-0 flex-col rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_28px_70px_rgba(2,6,23,0.2)]'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <h2 className='font-display text-[24px] font-semibold text-white'>结果</h2>
            {result?.size && (
              <div className='rounded-full border border-sky-300/15 bg-sky-300/10 px-3 py-1 text-[11px] text-sky-100/90'>{result.size}</div>
            )}
          </div>

          <div className='relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.08),transparent_22%),linear-gradient(180deg,rgba(8,13,24,0.98),rgba(10,15,24,0.94))] p-4'>
            <div className='pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]' />
            <div className='relative flex h-full items-center justify-center'>
              {result?.path ? (
                <div className='relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/40 shadow-[0_24px_60px_rgba(2,6,23,0.42)]'>
                  <img
                    src={`file://${result.path}?t=${previewToken}`}
                    alt='Generated wallpaper'
                    className='h-full max-h-[640px] w-full bg-black/30 object-contain'
                  />
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent' />
                </div>
              ) : (
                <div className='max-w-md text-center'>
                  <div className='h-18 w-18 mx-auto mb-5 flex items-center justify-center text-sky-100'>
                    {isGenerating ? <RefreshCw className='h-7 w-7 animate-spin' /> : <Sparkles className='h-7 w-7' />}
                  </div>
                  <h3 className='font-display text-2xl font-semibold text-white'>{isGenerating ? '正在生成壁纸' : '结果会出现在这里'}</h3>
                  {isGenerating ? (
                    <div className='mt-5 w-full'>
                      <div className='mb-2 flex items-center justify-between text-[12px] text-slate-400'>
                        <span>正在生成新的画面</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <div className='bg-white/8 h-2 overflow-hidden rounded-full'>
                        <div
                          className='h-full rounded-full bg-[linear-gradient(90deg,rgba(56,189,248,0.9),rgba(125,211,252,0.95),rgba(251,191,36,0.8))] transition-[width] duration-300 ease-out'
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className='mt-3 text-[13px] leading-7 text-slate-400'>写好提示词并选择分辨率后，点击生成按钮就可以了。</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='mt-4 flex flex-wrap justify-end gap-3'>
            <Button
              variant='outline'
              onClick={handleRevealInFinder}
              disabled={!result?.path}
              className='rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
            >
              <FolderOpen className='mr-2 h-4 w-4' />
              打开所在位置
            </Button>
            <Button
              variant='ghost'
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className='rounded-2xl text-slate-200 hover:bg-white/[0.06] hover:text-white'
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              重新生成
            </Button>
            <Button
              onClick={handleApplyWallpaper}
              loading={isApplying}
              disabled={!result?.path}
              className='min-w-[160px] rounded-2xl shadow-[0_18px_40px_rgba(56,189,248,0.22)]'
            >
              设为壁纸
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className='max-w-xl border-white/10 bg-[linear-gradient(180deg,rgba(8,15,28,0.98),rgba(10,18,30,0.96))] p-6 text-white shadow-[0_40px_140px_rgba(2,6,23,0.6)]'>
          <div className='space-y-4'>
            <div>
              <h3 className='font-display text-2xl font-semibold'>AI 模型设置</h3>
            </div>

            <div>
              <label className='mb-2 block text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>API Base URL</label>
              <Input
                value={aiConfig.apiBaseUrl}
                placeholder='https://api.openai.com/v1'
                onChange={(e) => setAiConfig((prev) => ({ ...prev, apiBaseUrl: e.target.value }))}
                className='h-11 border-white/10 bg-black/25 text-white placeholder:text-slate-500'
              />
            </div>

            <div>
              <label className='mb-2 block text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>API Key</label>
              <Input
                value={aiConfig.apiKey}
                placeholder='sk-...'
                type='password'
                onChange={(e) => setAiConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                className='h-11 border-white/10 bg-black/25 text-white placeholder:text-slate-500'
              />
            </div>

            <div>
              <label className='mb-2 block text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>图片模型</label>
              <Input
                value={aiConfig.model}
                placeholder='gpt-image-1 / glm-image'
                onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}
                className='h-11 border-white/10 bg-black/25 text-white placeholder:text-slate-500'
              />
            </div>

            <div className='flex flex-wrap gap-3 pt-2'>
              <Button onClick={handleSaveAiConfig} className='rounded-2xl px-5'>
                保存配置
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setAiConfig(readAiConfig())
                  setIsConfigOpen(false)
                }}
                className='rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
