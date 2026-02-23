import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const [count, setCount] = useState(0)
  return (
    <>
      <h1>Dashboard</h1>
      <div>
        <Button variant='outline' onClick={() => setCount(count + 1)}>
          count {count}
        </Button>
      </div>
    </>
  )
}
