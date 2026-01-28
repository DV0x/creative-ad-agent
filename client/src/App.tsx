import { AppLayout } from '@/components/layout/AppLayout'
import { EmptyState } from '@/components/EmptyState'
import { ResultsView } from '@/components/ResultsView'
import { useStore } from '@/store'

function App() {
  const { appState, isCreatingCampaign } = useStore()

  // Landing page: show empty state for initial prompt
  const showLanding = appState === 'landing' || isCreatingCampaign

  // Workspace: show results (images + chat sidebar)
  const showWorkspace = appState === 'workspace' && !isCreatingCampaign

  return (
    <AppLayout>
      {showLanding && <EmptyState />}
      {showWorkspace && <ResultsView />}
    </AppLayout>
  )
}

export default App
