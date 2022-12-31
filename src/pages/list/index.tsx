import { message, Image, Button } from 'antd'
import { Menu, MenuProps, Checkbox, Switch, Spin } from 'antd'
import { saveFile } from '@/utils/index'
import { getWallHavenAssets } from '@/api/index'
import { useRequest } from 'ahooks'
import _, { debounce } from 'lodash'
import { ipcRenderer } from 'electron'

export default function List() {
  const [wallpaperList, setWallpaperList] = useState<any[]>([])
  const [query, setQuery] = useState({
    page: 1,
    purity: '000',
    categories: '000',
  })

  const chooseWallPaper = async (item: any) => {
    console.log('chooseWallPaper', item.path)
    ipcRenderer.send('create-static-wallpaper', item.path)
    // saveFile(item.path, item.id)
  }

  const onLevelChange = (checkedValues: any) => {
    console.log('checked = ', checkedValues)
  }

  const onTypeChange = (checkedValues: any) => {
    console.log('checked = ', checkedValues)
  }

  // const { data, error, loading, run } = useRequest(getWallHavenAssets, { manual: true })
  // console.log('🚀🚀🚀 / data, error, loading', data, error, loading)
  // 获取壁纸
  let mounted = false
  const [loading, setLoading] = useState(false)
  const getWallpaper = () => {
    setLoading(true)
    if (!mounted) return
    getWallHavenAssets(query).then((res) => {
      const list = res.data
      setWallpaperList((prev) => [...prev, ...list])
      // setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
      setQuery(
        list.length &&
          Object.assign(query, {
            page: query.page + 1,
          }),
      )
      console.log('🚀🚀🚀 / getWallpaper', query)

      setLoading(false)
    })
  }

  // 滚动加载更多
  const main = document.querySelector('#main-content')!
  const onScroll = debounce(() => {
    if (loading) return
    const { scrollTop, scrollHeight, clientHeight } = main
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      // console.log('🚀🚀🚀 / getWallpaper')
      getWallpaper()
    }
  }, 800)

  useEffect(() => {
    main?.addEventListener('scroll', onScroll)
    getWallpaper()

    return () => {
      mounted = true
      main?.removeEventListener('scroll', onScroll)
    }
  }, [])
  return (
    <>
      <div className=''>{/* <Switch checkedChildren='人物' unCheckedChildren='人物' onChange={onLevelChange} defaultChecked /> */}</div>
      <div className='grid grid-cols-7 gap-4' onScroll={onScroll}>
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
