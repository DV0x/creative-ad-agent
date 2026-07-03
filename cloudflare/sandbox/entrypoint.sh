#!/bin/sh
# Memory watchdog (S139): a leak can pin the container at its 6GiB ceiling, which
# suffocates the /sandbox control server — the DO then can't reach the container
# at all and the user is locked out until the dead-man's switch fires. The S139
# retest named /sandbox ITSELF as the leaker (63→215MB while idle, all other
# processes flat), so this runs two stages:
#   1. kill the agent processes (frees memory if the leak is ours),
#   2. if memory stays pinned, exit the container entirely — the platform
#      restarts it fresh and the DO's existing safety nets recover in seconds.
# Before killing, dump the top memory consumers so the leaker names itself in
# the container logs (per-process RSS exists nowhere else in the telemetry).
SANDBOX_PID=$$
(
  while true; do
    sleep 60
    avail=$(grep MemAvailable /proc/meminfo | tr -dc 0-9)
    if [ -n "$avail" ] && [ "$avail" -lt 512000 ]; then
      echo "[watchdog] MemAvailable=${avail}kB below 500MB threshold — dumping top RSS, killing agent processes"
      for p in /proc/[0-9]*; do
        r=$(grep VmRSS "$p/status" 2>/dev/null | tr -dc 0-9)
        [ -n "$r" ] && echo "$r kB pid=$(basename "$p") $(tr '\0' ' ' < "$p/cmdline" 2>/dev/null | head -c 120)"
      done | sort -rn | head -8 | sed 's/^/[watchdog] /'
      pkill -9 -f 'agent-runner' 2>/dev/null
      pkill -9 -f 'claude' 2>/dev/null
      sleep 120
      avail=$(grep MemAvailable /proc/meminfo | tr -dc 0-9)
      if [ -n "$avail" ] && [ "$avail" -lt 512000 ]; then
        echo "[watchdog] memory still pinned (MemAvailable=${avail}kB) after agent kill — leaker is not the agent; restarting container"
        kill -9 "$SANDBOX_PID" 2>/dev/null
      fi
    fi
  done
) &
exec /sandbox
