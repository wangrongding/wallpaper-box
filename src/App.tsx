import { routes } from './routers'
import { useRoutes } from 'react-router-dom'

function App() {
  const outlet = useRoutes(routes)
  return <div className='App'>{outlet}</div>
}

export default App
