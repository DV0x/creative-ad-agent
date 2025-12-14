import { useAppStore } from '../store';
import { PHASES, PHASE_LABELS } from '../types';

export function ProgressDots() {
  const { phaseIndex, status } = useAppStore();

  if (status === 'idle') return null;

  return (
    <div className="border border-border bg-surface p-3 md:p-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-accent text-[10px] md:text-xs font-bold tracking-wider">PIPELINE</span>
          <span className="text-text-muted text-[10px]">{phaseIndex + 1}/{PHASES.length}</span>
        </div>
        <span className={`text-[10px] tracking-wider ${status === 'complete' ? 'text-success' : 'text-terminal-amber'}`}>
          {status === 'complete' ? 'DONE' : 'ACTIVE'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mb-3">
        <div className="h-0.5 bg-border w-full" />
        <div
          className="absolute top-0 left-0 h-0.5 bg-accent transition-all duration-500 ease-out"
          style={{ width: `${((phaseIndex + 1) / PHASES.length) * 100}%` }}
        />
      </div>

      {/* Phase indicators - horizontal scroll on mobile */}
      <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PHASES.map((phase, i) => {
          const isComplete = i < phaseIndex;
          const isCurrent = i === phaseIndex;
          const isPending = i > phaseIndex;

          return (
            <div key={phase} className="flex flex-col items-center shrink-0 flex-1 min-w-[48px]">
              {/* Indicator */}
              <div
                className={`
                  w-full h-6 md:h-8 flex items-center justify-center
                  border text-[10px] transition-all duration-300
                  ${isComplete ? 'bg-accent/20 border-accent text-accent' : ''}
                  ${isCurrent ? 'bg-accent border-accent text-void' : ''}
                  ${isPending ? 'bg-transparent border-border text-text-muted' : ''}
                `}
              >
                {isComplete ? '✓' : isCurrent ? '•' : String(i + 1).padStart(2, '0')}
              </div>

              {/* Label */}
              <span
                className={`
                  text-[9px] md:text-[10px] mt-1 uppercase tracking-wide
                  ${isComplete ? 'text-accent' : ''}
                  ${isCurrent ? 'text-text-primary' : ''}
                  ${isPending ? 'text-text-muted' : ''}
                `}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
