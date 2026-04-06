import { AppRoutes } from './routes'
import { DesktopRestriction } from './components/DesktopRestriction'
import { Toaster } from 'react-hot-toast'
import { AICopilot } from './components/AICopilot'

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <AICopilot />
      <DesktopRestriction />
      <AppRoutes />
    </>
  )
}

export default App
