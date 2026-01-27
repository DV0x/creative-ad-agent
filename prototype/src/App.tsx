import { AppLayout } from '@/components/layout/AppLayout'
import { EmptyState } from '@/components/EmptyState'
import { GeneratingView } from '@/components/GeneratingView'
import { ResultsView } from '@/components/ResultsView'
import { useStore } from '@/store'

function App() {
  const { appState, activeCampaignId, isCreatingCampaign } = useStore()

  // Show empty state when creating a new campaign or no campaign selected
  const showEmpty = (appState === 'empty' && !activeCampaignId) || isCreatingCampaign

  // Show results if there's an active campaign and not creating new
  const showResults = (appState === 'results' || activeCampaignId) && !isCreatingCampaign

  return (
    <AppLayout>
      {appState === 'generating' && <GeneratingView />}
      {showEmpty && appState !== 'generating' && <EmptyState />}
      {showResults && appState !== 'generating' && <ResultsView />}
    </AppLayout>
  )
}

export default App
