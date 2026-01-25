import { useAppStore } from '../store';
import { useWebSocket } from '../hooks/useWebSocket';

export function PromptInput() {
  const { prompt, setPrompt, status } = useAppStore();
  const { generate, cancel, isConnected, connectionState } = useWebSocket();
  const isGenerating = status === 'generating';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGenerating && prompt.trim()) {
      generate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="border border-border bg-surface">
        {/* Input header bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-1.5">
            <span className="text-accent text-[10px] md:text-xs font-bold tracking-wider">INPUT</span>
            <span className="text-text-muted text-[10px] hidden sm:inline">//</span>
            <span className="text-text-muted text-[10px] tracking-wide hidden sm:inline">DIRECTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection indicator */}
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                connectionState === 'connected' ? 'bg-terminal-green' :
                connectionState === 'connecting' || connectionState === 'reconnecting' ? 'bg-terminal-amber pulse-glow' :
                'bg-terminal-red'
              }`} />
              <span className="text-text-muted text-[10px] uppercase tracking-wider hidden sm:inline">
                {connectionState === 'connected' ? 'WS' : connectionState === 'reconnecting' ? 'RETRY' : 'OFF'}
              </span>
            </div>
            {/* Status indicator */}
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-terminal-amber pulse-glow' : 'bg-border-bright'}`} />
              <span className="text-text-muted text-[10px] uppercase tracking-wider">
                {isGenerating ? 'RUN' : 'IDLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Website URL + creative direction..."
            disabled={isGenerating}
            rows={2}
            className="w-full bg-transparent p-3 md:p-4
                       text-text-primary text-sm font-mono
                       placeholder:text-text-muted
                       focus:outline-none
                       resize-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-surface-raised">
          <span className="text-text-muted text-[10px] hidden sm:block">
            Style: brutalist, minimal, luxury
          </span>
          <div className="ml-auto flex items-center gap-2">
            {/* Cancel button - only show when generating */}
            {isGenerating && (
              <button
                type="button"
                onClick={cancel}
                className="px-3 py-1.5
                           bg-terminal-red/20 text-terminal-red text-[10px] md:text-xs font-bold tracking-wider uppercase
                           hover:bg-terminal-red/30
                           transition-colors duration-150
                           flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                <span>STOP</span>
              </button>
            )}
            {/* Execute button */}
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim() || !isConnected}
              className="px-4 py-1.5
                         bg-accent text-void text-[10px] md:text-xs font-bold tracking-wider uppercase
                         disabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed
                         hover:bg-text-primary hover:text-void
                         transition-colors duration-150
                         flex items-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>RUNNING</span>
                </>
              ) : !isConnected ? (
                <span>CONNECTING...</span>
              ) : (
                <>
                  <span>EXECUTE</span>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
