import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { EmptyState } from '@/components/EmptyState'
import { LandingPage } from '@/components/landing/LandingPage'
import { ResultsView } from '@/components/ResultsView'
import { SignIn } from '@/components/auth/SignIn'
import { AuthProvider } from '@/contexts/AuthContext'
import { useStore } from '@/store'
import { PricingModal } from '@/components/pricing/PricingModal'
import { TopupModal } from '@/components/pricing/TopupModal'
import { isDevMode } from '@/lib/auth'
import { campaignsApi, assetsApi, creditsApi, paymentsApi, setTokenGetter } from '@/lib/api'
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
    setCreditBalance,
    setSubscription,
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

  // Sync appState → URL
  useEffect(() => {
    const targetPath = appState === 'workspace' ? '/workspace' : '/'
    if (window.location.pathname !== targetPath && window.location.pathname !== '/sign-in') {
      window.history.pushState({}, '', targetPath)
    }
  }, [appState])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/workspace') {
        setAppState('workspace')
      } else if (path === '/') {
        setAppState('landing')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setAppState])

  // Load data when user is signed in
  useEffect(() => {
    // Don't load if not ready or already loaded
    if (!isLoaded || !isSignedIn || dataLoaded) return

    async function loadData() {
      setDataLoading(true)
      setLoadError(null)

      try {
        // Fetch campaigns, folders, credits, and subscription in parallel
        const [campaignsList, folders, creditsData, subscriptionData] = await Promise.all([
          campaignsApi.list(),
          assetsApi.listFolders(),
          creditsApi.get().catch(() => null),
          paymentsApi.getSubscription().catch(() => ({ plan: 'free' as const, status: 'active' })),
        ])

        if (creditsData) {
          setCreditBalance(creditsData.balance, creditsData.plan_balance, creditsData.topup_balance)
        }
        if (subscriptionData) {
          setSubscription(subscriptionData)
        }

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
        // Load persisted messages for all campaigns.
        // Exclude the recovering campaign — its messages will be loaded by
        // handleConnected before subscribe, so the bulk setter can't overwrite them.
        if (Object.keys(messagesByCampaign).length > 0) {
          // Exclude messages for campaigns with active WS recovery (generating status).
          // For completed/errored/cancelled campaigns, load messages normally —
          // there's no live recovery to protect from being overwritten.
          const activeSessionRaw = localStorage.getItem('creative-agent:activeSession')
          const activeSession = activeSessionRaw ? JSON.parse(activeSessionRaw) : null
          const activeCampaignId = activeSession?.campaignId
          if (activeCampaignId) {
            const activeCampaign = fullCampaigns.find(c => c.id === activeCampaignId)
            if (activeCampaign?.status === 'generating') {
              delete messagesByCampaign[activeCampaignId]
            }
          }
          if (Object.keys(messagesByCampaign).length > 0) {
            setChatMessages(messagesByCampaign)
          }
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
  }, [isLoaded, isSignedIn, dataLoaded, setDataLoading, setCampaigns, setAssetFolders, setCreditBalance, setSubscription])

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
      // If WebSocket recovery is already active, don't interfere —
      // handleConnected owns the recovery flow and this effect could
      // race with it and null out generatingCampaignId.
      if (useStore.getState().generatingCampaignId) {
        setRecoveryChecked(true)
        return
      }

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
          // Agent stopped — try to recover from R2 completion marker
          console.log(`⚠️ Campaign ${campaign.id} agent stopped, attempting recovery...`)
          try {
            const result = await campaignsApi.recover(campaign.id)
            if (result.recovered && result.campaign) {
              console.log(`✅ Recovered campaign ${campaign.id}: ${result.imagesAdded} images, ${result.filesUpdated} files`)
              // Update local store with recovered data
              const store = useStore.getState()
              store.setCampaigns(
                store.campaigns.map(c => c.id === campaign.id ? result.campaign! : c)
              )
              if (result.messages) {
                store.setChatMessagesForCampaign(campaign.id, result.messages)
              }
              setActiveCampaignId(campaign.id)
              setAppState('workspace')
            } else {
              // No marker found — fall through to mark incomplete
              console.log(`⚠️ No recovery marker for ${campaign.id} (${result.reason}), marking incomplete`)
              updateCampaignStatus(campaign.id, 'incomplete')
              campaignsApi.update(campaign.id, { status: 'incomplete' }).catch(console.error)
            }
          } catch (recoverErr) {
            console.error('Recovery failed:', recoverErr)
            updateCampaignStatus(campaign.id, 'incomplete')
            campaignsApi.update(campaign.id, { status: 'incomplete' }).catch(console.error)
          }
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
          <p className="text-red-600 mb-4">{loadError}</p>
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

  // Marketing landing for visitors / zero-campaign users.
  // The "New Campaign" inline form (isCreatingCampaign) keeps the existing EmptyState.
  const showMarketingLanding = showLanding && !isCreatingCampaign

  return (
    <>
      {showMarketingLanding ? (
        <LandingPage />
      ) : (
        <AppLayout>
          {showLanding && isCreatingCampaign && <EmptyState />}
          {showWorkspace && <ResultsView />}
        </AppLayout>
      )}

      {/* Payment modals (rendered at root, triggered from anywhere) */}
      <PricingModal />
      <TopupModal />
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

function CheckoutSuccess() {
  const [status, setStatus] = useState<'polling' | 'slow' | 'success'>('polling')

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    async function poll() {
      while (!cancelled) {
        try {
          const [sub, credits] = await Promise.all([
            paymentsApi.getSubscription(),
            creditsApi.get().catch(() => null),
          ])
          if (sub.plan !== 'free' || (credits && credits.balance > 0)) {
            if (!cancelled) {
              useStore.getState().setSubscription(sub)
              if (credits) useStore.getState().setCreditBalance(credits.balance, credits.plan_balance, credits.topup_balance)
              setStatus('success')
              setTimeout(() => { window.location.href = '/' }, 1500)
            }
            return
          }
        } catch { /* retry */ }

        // Switch to "slow" UI after 15s to surface a manual escape hatch.
        // Polling continues regardless — auto-redirect still works when credits arrive.
        if (!cancelled && Date.now() - startedAt > 15000 && status !== 'slow') {
          setStatus(s => s === 'polling' ? 'slow' : s)
        }
        // First 30s: poll every 2s. After that: every 4s (saves API calls during long waits).
        const interval = Date.now() - startedAt < 30000 ? 2000 : 4000
        await new Promise(r => setTimeout(r, interval))
      }
    }

    poll()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center max-w-md">
        {status === 'polling' && (
          <>
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">Payment received!</h2>
            <p className="text-text-secondary">Your credits are on the way...</p>
          </>
        )}
        {status === 'slow' && (
          <>
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">Almost there!</h2>
            <p className="text-text-secondary mb-4">Still waiting on your credits — they'll appear here automatically, or you can head to the workspace.</p>
            <a href="/" className="text-accent hover:underline">Go to workspace</a>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">You're all set!</h2>
            <p className="text-text-secondary">Redirecting to your workspace...</p>
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  if (isDevMode()) {
    return <DevModeApp />
  }

  // Handle /sign-in route (no React Router — simple path check)
  const pathname = window.location.pathname
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    return <SignIn />
  }

  // Handle /checkout/success — optimistic UI while webhook processes
  if (pathname === '/checkout/success') {
    return <CheckoutSuccess />
  }

  return <AuthenticatedApp />
}

export default App
