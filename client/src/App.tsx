import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingHeader } from '@/components/layout/LandingHeader'
import { EmptyState } from '@/components/EmptyState'
import { ResultsView } from '@/components/ResultsView'
import { AuthProvider } from '@/contexts/AuthContext'
import { useStore } from '@/store'
import { isDevMode } from '@/lib/auth'
import { campaignsApi, assetsApi, setTokenGetter } from '@/lib/api'
import * as wsManager from '@/lib/websocket-manager'

function AppContent() {
  const {
    appState,
    campaigns,
    isCreatingCampaign,
    dataLoading,
    setDataLoading,
    setCampaigns,
    setAssetFolders,
    setChatMessages,
    setActiveCampaignId,
    setAppState,
    updateCampaignStatus,
    setPrompt,
    setPendingGeneration,
  } = useStore()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [recoveryChecked, setRecoveryChecked] = useState(false)

  // Get auth state (in dev mode, always signed in)
  const devAuth = { isSignedIn: true, isLoaded: true }
  const clerkAuth = isDevMode() ? devAuth : useAuth()
  const { isSignedIn, isLoaded } = clerkAuth

  // Load data when user is signed in
  useEffect(() => {
    // Don't load if not ready or already loaded
    if (!isLoaded || !isSignedIn || dataLoaded) return

    async function loadData() {
      setDataLoading(true)
      setLoadError(null)

      try {
        // Fetch campaigns and folders in parallel
        const [campaignsList, folders] = await Promise.all([
          campaignsApi.list(),
          assetsApi.listFolders(),
        ])

        // For each folder, fetch its files
        const foldersWithFiles = await Promise.all(
          folders.map(async (folder) => {
            const files = await assetsApi.getFiles(folder.id)
            return { ...folder, files }
          })
        )

        // For each campaign, fetch full details and messages (grouped by campaignId)
        const messagesByCampaign: Record<string, import('@/types/chat').ChatMessage[]> = {}
        const fullCampaigns = await Promise.all(
          campaignsList.map(async (campaign) => {
            try {
              const { campaign: full, messages } = await campaignsApi.get(campaign.id)
              // Collect messages from all campaigns that have them.
              // Active generations will overwrite via reconstructForRecovery.
              if (messages.length > 0) {
                messagesByCampaign[campaign.id] = messages
              }
              return full
            } catch {
              return campaign
            }
          })
        )

        setCampaigns(fullCampaigns)
        setAssetFolders(foldersWithFiles)
        // Load persisted messages (for post-generation refresh)
        // Skip if recovery already populated chatMessages (active generation)
        const hasActiveRecovery = localStorage.getItem('creative-agent:activeSession')
        if (Object.keys(messagesByCampaign).length > 0 && !hasActiveRecovery) {
          setChatMessages(messagesByCampaign)
        }
        setDataLoaded(true)
      } catch (err) {
        console.error('Failed to load data:', err)
        setLoadError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
  }, [isLoaded, isSignedIn, dataLoaded, setDataLoading, setCampaigns, setAssetFolders])

  // After data loads: restore pending prompt OR auto-navigate to workspace
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !dataLoaded) return

    // First priority: restore prompt saved before Clerk auth redirect
    const pendingPrompt = sessionStorage.getItem('creative-agent:pendingPrompt')
    if (pendingPrompt) {
      sessionStorage.removeItem('creative-agent:pendingPrompt')
      setPrompt(pendingPrompt)
      setPendingGeneration(true)
      return
    }

    // Second priority: if user has campaigns and is on landing, go to workspace
    if (appState === 'landing' && !isCreatingCampaign && campaigns.length > 0) {
      const mostRecent = [...campaigns].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0]
      setActiveCampaignId(mostRecent.id)
      setAppState('workspace')
    }
  }, [isLoaded, isSignedIn, dataLoaded, setPrompt, setPendingGeneration, appState, isCreatingCampaign, campaigns, setActiveCampaignId, setAppState])

  // Check for campaigns that need recovery (generating status)
  useEffect(() => {
    if (!dataLoaded || recoveryChecked || campaigns.length === 0) return

    async function checkForRecovery() {
      // Find campaigns with 'generating' status (most recent first)
      const generatingCampaigns = campaigns
        .filter(c => c.status === 'generating')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      if (generatingCampaigns.length === 0) {
        setRecoveryChecked(true)
        return
      }

      // Check the most recent generating campaign
      const campaign = generatingCampaigns[0]
      console.log(`🔍 Found generating campaign ${campaign.id}, checking status...`)

      try {
        const statusInfo = await campaignsApi.getStatus(campaign.id)

        if (statusInfo.isAgentRunning && statusInfo.hasEventBuffer && statusInfo.sessionId) {
          // Agent is still running - set up recovery
          console.log(`✅ Agent running for campaign ${campaign.id}, setting up recovery...`)

          // Only write to localStorage if no session already exists
          // (generate() saves the session with the correct prompt — don't overwrite it)
          const existing = localStorage.getItem('creative-agent:activeSession')
          if (!existing) {
            localStorage.setItem('creative-agent:activeSession', JSON.stringify({
              sessionId: statusInfo.sessionId,
              prompt: campaign.name,
              campaignId: campaign.id,
              messageId: '',
              startedAt: Date.now()
            }))
          }

          // Switch to workspace and set active campaign
          setActiveCampaignId(campaign.id)
          setAppState('workspace')
          // WebSocket will auto-connect and recover via useWebSocket
        } else if (statusInfo.status === 'incomplete' || !statusInfo.isAgentRunning) {
          // Agent stopped - update local state AND database
          console.log(`⚠️ Campaign ${campaign.id} marked as incomplete (agent stopped)`)
          updateCampaignStatus(campaign.id, 'incomplete')
          campaignsApi.update(campaign.id, { status: 'incomplete' }).catch(console.error)
        }
      } catch (err) {
        console.error('Failed to check campaign status:', err)
      }

      setRecoveryChecked(true)
    }

    checkForRecovery()
  }, [dataLoaded, recoveryChecked, campaigns, setActiveCampaignId, setAppState, updateCampaignStatus])

  // Landing page: show empty state for initial prompt
  const showLanding = appState === 'landing'

  // Workspace: show results (images + chat sidebar)
  const showWorkspace = appState === 'workspace'

  // Show loading state only when loading data in workspace
  if (dataLoading && showWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  // Show error with retry
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{loadError}</p>
          <button
            onClick={() => {
              setDataLoaded(false)
              setLoadError(null)
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Show header on landing page */}
      {showLanding && <LandingHeader />}

      <AppLayout>
        {showLanding && <EmptyState />}
        {showWorkspace && <ResultsView />}
      </AppLayout>
    </>
  )
}

function AuthenticatedApp() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  // Ref always holds latest getToken — updated during render, before effects
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  // Stable token getter that calls through ref so it's always current
  const stableTokenGetter = useRef(async () => {
    try {
      return await getTokenRef.current()
    } catch {
      return null
    }
  }).current

  // Set up token getter for REST API calls
  useEffect(() => {
    setTokenGetter(stableTokenGetter)
  }, [stableTokenGetter])

  // Connect WebSocket only after Clerk auth is loaded AND user is signed in.
  // WebSocket is only needed for generation, which requires auth — no reason
  // to connect before sign-in. This also prevents the anonymous connection
  // that occurs when getToken() isn't ready on the first StrictMode mount.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    wsManager.connectWithAuth(stableTokenGetter)
  }, [isLoaded, isSignedIn, stableTokenGetter])

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function DevModeApp() {
  // No auth — connect WebSocket immediately
  useEffect(() => {
    wsManager.connectWithAuth()
  }, [])

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function App() {
  if (isDevMode()) {
    return <DevModeApp />
  }

  return <AuthenticatedApp />
}

export default App
