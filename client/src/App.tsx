import { PromptInput } from './components/PromptInput';
import { ProgressDots } from './components/ProgressDots';
import { Terminal } from './components/Terminal';
import { ImageGrid } from './components/ImageGrid';

function App() {
  return (
    <div className="min-h-screen bg-void flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent" />
            <span className="text-text-muted text-[10px] tracking-widest uppercase">Online</span>
          </div>
          <span className="text-text-muted text-[10px] font-mono">v1.0</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 md:py-12">
        {/* Header - compact on mobile */}
        <header className="mb-6 md:mb-12">
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-text-primary italic leading-tight">
            Creative Machine
          </h1>
          <p className="text-text-secondary text-xs md:text-sm tracking-wide mt-1 md:mt-2">
            Ad creatives from any URL
          </p>
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-accent via-border to-transparent mt-4 md:mt-6" />
        </header>

        {/* Main content stack */}
        <div className="space-y-4 md:space-y-6">
          <PromptInput />
          <ProgressDots />
          <Terminal />
          <ImageGrid />
        </div>
      </div>

      {/* Footer - fixed at bottom on mobile */}
      <footer className="border-t border-border shrink-0 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-[10px] md:text-xs">
            <span className="text-text-muted">
              Powered by <span className="text-text-secondary">Claude</span> + <span className="text-text-secondary">Gemini</span>
            </span>
            <div className="flex items-center gap-2 md:gap-4 text-text-muted">
              <span>Research</span>
              <span className="text-border">/</span>
              <span>Hooks</span>
              <span className="text-border">/</span>
              <span>Art</span>
              <span className="text-border">/</span>
              <span>Images</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
