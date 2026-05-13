import { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import { ScreenRouter } from './components/ScreenRouter'
import { LoadingScreen } from '@/components/LoadingScreen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}

function AppInner() {
  const isLoading = useAuthStore(s => s.isLoading)
  const currentScreen = useGameStore(s => s.currentScreen)
  const restoreSession = useAuthStore(s => s.restoreSession)
  const initializeGame = useGameStore(s => s.initializeGame)
  const setScreen = useGameStore(s => s.setScreen)
  
  const initRef = useRef(false)

  // useEffect(() => {
  //   if (initRef.current) return
  //   initRef.current = true
    
  //   const boot = async () => {
  //     try {
  //       const user = await restoreSession();
  //       if (user?.userId) {
  //         await initializeGame();
  //       } else {
  //         setScreen('login')
  //       }
  //     } catch (err) {
  //       setScreen('login')
  //     }
  //   };
  //   boot();
  // }, []);
    useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    // This runs ONCE on mount
    const boot = async () => {
      try {
        const user = await restoreSession();
        if (user?.userId) {
          await initializeGame();
        } else {
          setScreen('login')
        }
      } catch (err) {
        console.error('[App] Boot failed:', err)
        setScreen('login')
      }
    };
    boot();
  }, []);

  // Show global loading state
  if (isLoading || currentScreen === 'loading') {
    return <LoadingScreen /> // You can extract the loading UI into its own component too
  }

  // Delegate all routing to the ScreenRouter
  return <ScreenRouter />
}
