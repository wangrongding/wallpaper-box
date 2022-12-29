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

  // 获取壁纸
  const getWallpaper = () => {
    setLoading(true)
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
    console.log('useEffect')
    getWallpaper()
  }, [])
  return (
    <>
      <h1>list</h1>
      <div className=''>
        <div style={{ display: 'inline-block', float: 'left', margin: ' 0 20px ' }}>
          <Switch checkedChildren='人物' unCheckedChildren='人物' onChange={onLevelChange} defaultChecked />
        </div>
        部分功能开发中......
      </div>
      <div className='' onScroll={onScroll} ref={scrollRef}>
        {wallpaperList.map((item: any, index: number) => {
          return (
            <Image
              onContextMenu={() => {
                chooseWallPaper(item)
              }}
              className=''
              key={index}
              src={item.thumbs.small}
              preview={{
                src: item.path,
              }}
            />
          )
        })}
        <Spin style={{ gridColumn: '1 / 6' }} size='large' />
      </div>
    </>
  )
}
