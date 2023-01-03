import { Button } from 'antd'
export default function Dashboard() {
  const [count, setCount] = useState(0)
  return (
    <>
      <h1>Dashboard</h1>
      <div>
        <Button
          type='default'
          onClick={() => {
            setCount(count + 1)
          }}
        >
          count {count}
        </Button>
      </div>
    </>
  )
}
