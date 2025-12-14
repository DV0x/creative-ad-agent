Sandbox Configuration
SandboxSettings
Configuration for sandbox behavior. Use this to enable command sandboxing and configure network restrictions programmatically.

type SandboxSettings = {
  enabled?: boolean;
  autoAllowBashIfSandboxed?: boolean;
  excludedCommands?: string[];
  allowUnsandboxedCommands?: boolean;
  network?: NetworkSandboxSettings;
  ignoreViolations?: SandboxIgnoreViolations;
  enableWeakerNestedSandbox?: boolean;
}
Property	Type	Default	Description
enabled	boolean	false	Enable sandbox mode for command execution
autoAllowBashIfSandboxed	boolean	false	Auto-approve bash commands when sandbox is enabled
excludedCommands	string[]	[]	Commands that always bypass sandbox restrictions (e.g., ['docker']). These run unsandboxed automatically without model involvement
allowUnsandboxedCommands	boolean	false	Allow the model to request running commands outside the sandbox. When true, the model can set dangerouslyDisableSandbox in tool input, which falls back to the permissions system
network	NetworkSandboxSettings	undefined	Network-specific sandbox configuration
ignoreViolations	SandboxIgnoreViolations	undefined	Configure which sandbox violations to ignore
enableWeakerNestedSandbox	boolean	false	Enable a weaker nested sandbox for compatibility
Filesystem and network access restrictions are NOT configured via sandbox settings. Instead, they are derived from permission rules:

Filesystem read restrictions: Read deny rules
Filesystem write restrictions: Edit allow/deny rules
Network restrictions: WebFetch allow/deny rules
Use sandbox settings for command execution sandboxing, and permission rules for filesystem and network access control.

Example usage
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  prompt: "Build and test my project",
  options: {
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      excludedCommands: ["docker"],
      network: {
        allowLocalBinding: true,
        allowUnixSockets: ["/var/run/docker.sock"]
      }
    }
  }
});
NetworkSandboxSettings
Network-specific configuration for sandbox mode.

type NetworkSandboxSettings = {
  allowLocalBinding?: boolean;
  allowUnixSockets?: string[];
  allowAllUnixSockets?: boolean;
  httpProxyPort?: number;
  socksProxyPort?: number;
}
Property	Type	Default	Description
allowLocalBinding	boolean	false	Allow processes to bind to local ports (e.g., for dev servers)
allowUnixSockets	string[]	[]	Unix socket paths that processes can access (e.g., Docker socket)
allowAllUnixSockets	boolean	false	Allow access to all Unix sockets
httpProxyPort	number	undefined	HTTP proxy port for network requests
socksProxyPort	number	undefined	SOCKS proxy port for network requests
SandboxIgnoreViolations
Configuration for ignoring specific sandbox violations.

type SandboxIgnoreViolations = {
  file?: string[];
  network?: string[];
}
Property	Type	Default	Description
file	string[]	[]	File path patterns to ignore violations for
network	string[]	[]	Network patterns to ignore violations for
Permissions Fallback for Unsandboxed Commands
When allowUnsandboxedCommands is enabled, the model can request to run commands outside the sandbox by setting dangerouslyDisableSandbox: true in the tool input. These requests fall back to the existing permissions system, meaning your canUseTool handler will be invoked, allowing you to implement custom authorization logic.

excludedCommands vs allowUnsandboxedCommands:

excludedCommands: A static list of commands that always bypass the sandbox automatically (e.g., ['docker']). The model has no control over this.
allowUnsandboxedCommands: Lets the model decide at runtime whether to request unsandboxed execution by setting dangerouslyDisableSandbox: true in the tool input.
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  prompt: "Deploy my application",
  options: {
    sandbox: {
      enabled: true,
      allowUnsandboxedCommands: true  // Model can request unsandboxed execution
    },
    permissionMode: "default",
    canUseTool: async (tool, input) => {
      // Check if the model is requesting to bypass the sandbox
      if (tool === "Bash" && input.dangerouslyDisableSandbox) {
        // The model wants to run this command outside the sandbox
        console.log(`Unsandboxed command requested: ${input.command}`);

        // Return true to allow, false to deny
        return isCommandAuthorized(input.command);
      }
      return true;
    }
  }
});
This pattern enables you to:

Audit model requests: Log when the model requests unsandboxed execution
Implement allowlists: Only permit specific commands to run unsandboxed
Add approval workflows: Require explicit authorization for privileged operations
Commands running with dangerouslyDisableSandbox: true have full system access. Ensure your canUseTool handler validates these requests carefully.