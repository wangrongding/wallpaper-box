import { Button, Input } from 'antd'

export default function Setting() {
  const [rootPath, setRootPath] = useState('/wallpaper-box')

  return (
    <div>
      <h1>Setting</h1>

      <p>部分功能开发中......</p>

      {/* 设置代理 */}
      <h2>网络代理：</h2>
      <p>设置代理后，可以访问被墙的网站。</p>
      <p>代理服务器地址：</p>
      <Input type='text' />
      <p>代理服务器端口：</p>
      <Input type='text' />

      <p>图片存储位置：根目录下的 /wallpaper-box </p>
      <div className='flex'>
        <Input type='url' value={rootPath} />
        <Input type='file' />
        {/* <Button type='primary'>选择文件夹</Button> */}
      </div>
    </div>
  )
}
