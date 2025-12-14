import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';

export function Terminal() {
  const { terminalLines, status } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [terminalLines]);

  if (status === 'idle') return null;

  return (
    <div className="border border-border bg-surface overflow-hidden animate-fadeIn">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-raised">
        <div className="flex items-center gap-1.5">
          <span className="text-terminal-green text-[10px] md:text-xs font-bold tracking-wider">LOG</span>
          <span className="text-text-muted text-[10px]">{terminalLines.length}</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-error/50" />
          <div className="w-1.5 h-1.5 bg-warning/50" />
          <div className="w-1.5 h-1.5 bg-success/50" />
        </div>
      </div>

      {/* Terminal content */}
      <div
        ref={containerRef}
        className="p-3 font-mono text-[11px] md:text-xs leading-relaxed
                   max-h-[200px] md:max-h-[280px] overflow-y-auto
                   terminal-scroll"
      >
        {terminalLines.map((line) => (
          <div
            key={line.id}
            className={`
              py-0.5 break-all
              ${line.type === 'command' ? 'text-terminal-green' : ''}
              ${line.type === 'output' ? 'text-text-secondary' : ''}
              ${line.type === 'success' ? 'text-success font-bold' : ''}
              ${line.type === 'error' ? 'text-error' : ''}
            `}
          >
            <span className="text-text-muted mr-1.5 select-none">
              {line.type === 'command' && '>'}
              {line.type === 'output' && '|'}
              {line.type === 'success' && '✓'}
              {line.type === 'error' && '✗'}
            </span>
            <span className="break-words">{line.text}</span>
          </div>
        ))}

        {status === 'generating' && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-text-muted select-none">{'>'}</span>
            <span className="w-1.5 h-3 bg-terminal-green cursor-blink" />
          </div>
        )}
      </div>

      {/* Terminal footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-void/50 text-[10px]">
        <span className={
          status === 'generating' ? 'text-terminal-amber' :
          status === 'complete' ? 'text-success' :
          status === 'error' ? 'text-error' : 'text-text-muted'
        }>
          {status === 'generating' ? 'Processing...' :
           status === 'complete' ? 'Complete' :
           status === 'error' ? 'Failed' : 'Idle'}
        </span>
      </div>
    </div>
  );
}
