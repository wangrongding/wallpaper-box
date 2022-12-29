import { message, Image, Button } from 'antd'
import { Menu, MenuProps, Checkbox, Switch, Spin } from 'antd'
import { saveFile } from '@/utils/index'
import { getWallHavenAssets } from '@/api/index'
import _, { debounce } from 'lodash'
export default function List() {
  const scrollRef = createRef<HTMLDivElement>()
  const [loading, setLoading] = useState(false)
  const [wallpaperList, setWallpaperList] = useState<any[]>([])
  const [query, setQuery] = useState({
    page: 1,
    purity: '000',
    categories: '000',
  })

  const chooseWallPaper = (item: any) => {
    console.log(item.path)
    saveFile(item.path, item.id)
  }

  const onLevelChange = (checkedValues: any) => {
    console.log('checked = ', checkedValues)
  }

  const onTypeChange = (checkedValues: any) => {
    console.log('checked = ', checkedValues)
  }
  // 滚动加载更多
  const onScroll = debounce(() => {
    if (loading) return
    let clientHeight = scrollRef.current!.clientHeight //可视区域高度
    let scrollTop = scrollRef.current!.scrollTop //滚动条滚动高度
    let scrollHeight = scrollRef.current!.scrollHeight //滚动内容高度
    if (clientHeight + scrollTop + 200 > scrollHeight) {
      getWallpaper()
    }
  }, 1000)

  let mounted = false
  // 获取壁纸
  const getWallpaper = () => {
    setLoading(true)
    if (!mounted) return
    getWallHavenAssets(query).then((res) => {
      const list = res.data
      setWallpaperList([...wallpaperList, ...list])
      setQuery(
        list.length &&
          Object.assign(query, {
            page: query.page + 1,
          }),
      )
      setLoading(false)
    })
  }

  useEffect(() => {
    getWallpaper()
    return () => {
      mounted = true
    }
  }, [])
  return (
    <>
      <div className=''>{/* <Switch checkedChildren='人物' unCheckedChildren='人物' onChange={onLevelChange} defaultChecked /> */}</div>
      <div className='grid grid-cols-5 gap-4' onScroll={onScroll} ref={scrollRef}>
        {wallpaperList.map((item: any, index: number) => {
          return (
            <Image
              rootClassName='custom-image'
              onContextMenu={() => {
                chooseWallPaper(item)
              }}
              key={index}
              src={item.thumbs.small}
              preview={{
                src: item.path,
              }}
            />
          )
        })}
      </div>
      <div className='text-center mt-[30px]'>
        <Spin size='large' />
      </div>
    </>
  )
}
