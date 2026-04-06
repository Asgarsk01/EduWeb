import { AppRoutes } from './routes'
import { DesktopRestriction } from './components/DesktopRestriction'
import { Toaster } from 'react-hot-toast'

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <DesktopRestriction />
      <AppRoutes />
    </>
  )
}

export default App
