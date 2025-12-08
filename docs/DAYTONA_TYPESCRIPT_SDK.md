# Daytona TypeScript SDK Documentation

## Table of Contents
1. [Installation and Setup](#installation-and-setup)
2. [Configuration](#configuration)
3. [Getting Started](#getting-started)
4. [Core Concepts](#core-concepts)
5. [TypeScript SDK Usage](#typescript-sdk-usage)
6. [API References](#api-references)

---

## Installation and Setup

### Install the Daytona SDK

Install the SDK using your preferred package manager:

```bash
# Using npm
npm install @daytonaio/sdk

# Using yarn
yarn add @daytonaio/sdk

# Using pnpm
pnpm add @daytonaio/sdk
```

### Getting Your API Key

1. Navigate to the [Daytona Dashboard](https://app.daytona.io/dashboard)
2. Go to [API Keys](https://app.daytona.io/dashboard/keys)
3. Click the **Create Key** button
4. Copy your newly created API key

---

## Configuration

### Configuration Methods

Daytona SDK supports multiple configuration approaches (in order of precedence):

1. **Configuration in code**
2. **Environment variables**
3. **.env file**
4. **Default values**

### Configuration in Code

```typescript
import { DaytonaConfig } from '@daytonaio/sdk';

const config: DaytonaConfig = {
    apiKey: "your-api-key",
    apiUrl: "your-api-url",
    target: "us"
};
```

### Environment Variables

The SDK automatically looks for these environment variables:

| Variable | Description | Optional |
|----------|-------------|----------|
| `DAYTONA_API_KEY` | Your Daytona API key | No |
| `DAYTONA_API_URL` | URL of your Daytona API | Yes |
| `DAYTONA_TARGET` | Daytona Target to create Sandboxes on | Yes |

Set environment variables in your shell:

```bash
export DAYTONA_API_KEY=your-api-key
export DAYTONA_API_URL=https://your-api-url
export DAYTONA_TARGET=us
```

### .env File

Create a `.env` file in your project root:

```bash
DAYTONA_API_KEY=your-api-key
DAYTONA_API_URL=https://your-api-url
DAYTONA_TARGET=us
```

### Default Values

If no configuration is provided, these defaults apply:

| Option | Default Value |
|--------|---------------|
| API URL | `https://app.daytona.io/api` |
| Target | Default region for the organization |

---

## Getting Started

### Quick Start Example

```typescript
import { Daytona } from '@daytonaio/sdk';

// Initialize the Daytona client
const daytona = new Daytona({ apiKey: 'YOUR_API_KEY' });

let sandbox;
try {
    // Create the Sandbox instance
    sandbox = await daytona.create({
        language: "typescript",
    });

    // Run code securely inside the Sandbox
    const response = await sandbox.process.codeRun(
        'console.log("Sum of 3 and 4 is " + (3 + 4))'
    );

    if (response.exitCode !== 0) {
        console.error("Error running code:", response.exitCode, response.result);
    } else {
        console.log(response.result);
    }
} catch (error) {
    console.error("Sandbox flow error:", error);
} finally {
    // Clean up the Sandbox
    if (sandbox) {
        await sandbox.delete();
    }
}
```

### Simple "Hello World" Example

```typescript
import { Daytona } from '@daytonaio/sdk';

// Initialize the Daytona client
const daytona = new Daytona({ apiKey: 'your-api-key' });

// Create the Sandbox instance
const sandbox = await daytona.create({
    language: 'typescript',
});

// Run the code securely inside the Sandbox
const response = await sandbox.process.codeRun('console.log("Hello World from code!")')
console.log(response.result);

// Clean up
await sandbox.delete()
```

---

## Core Concepts

### Sandboxes

Sandboxes are isolated, secure execution environments where your code runs. Each sandbox:
- Has its own file system
- Can run code in multiple languages (Python, TypeScript, JavaScript)
- Supports resource allocation (CPU, memory, disk)
- Can be started, stopped, archived, or deleted
- Has configurable auto-stop, auto-archive, and auto-delete intervals

### Snapshots

Snapshots are pre-configured images that serve as templates for creating sandboxes. They can contain:
- Pre-installed packages and dependencies
- Custom configurations
- Application code
- Environment setup

### Volumes

Volumes provide persistent storage that can be attached to sandboxes. They allow data to persist across sandbox lifecycle events.

---

## TypeScript SDK Usage

### Initializing the Client

#### Using Environment Variables

```typescript
import { Daytona } from '@daytonaio/sdk';

// Uses DAYTONA_API_KEY, DAYTONA_API_URL, DAYTONA_TARGET
const daytona = new Daytona();
const sandbox = await daytona.create();
```

#### Using Explicit Configuration

```typescript
import { Daytona } from '@daytonaio/sdk';

const config: DaytonaConfig = {
    apiKey: "your-api-key",
    apiUrl: "https://your-api.com",
    target: "us"
};
const daytona = new Daytona(config);
```

### Creating Sandboxes

#### Create Default Sandbox

```typescript
const sandbox = await daytona.create();
```

#### Create from Snapshot

```typescript
const params: CreateSandboxFromSnapshotParams = {
    language: 'typescript',
    snapshot: 'my-snapshot-id',
    envVars: {
        NODE_ENV: 'development',
        DEBUG: 'true'
    },
    autoStopInterval: 60,
    autoArchiveInterval: 60,
    autoDeleteInterval: 120
};
const sandbox = await daytona.create(params, { timeout: 100 });
```

#### Create from Image

```typescript
const sandbox = await daytona.create({ image: 'debian:12.9' }, {
    timeout: 90,
    onSnapshotCreateLogs: console.log
});
```

#### Create with Declarative Image

```typescript
const image = Image.base('alpine:3.18').pipInstall(['numpy', 'pandas']);
const params: CreateSandboxFromImageParams = {
    language: 'typescript',
    image,
    envVars: {
        NODE_ENV: 'development',
        DEBUG: 'true'
    },
    resources: {
        cpu: 2,
        memory: 4 // 4GB RAM
    },
    autoStopInterval: 60,
    autoArchiveInterval: 60,
    autoDeleteInterval: 120
};
const sandbox = await daytona.create(params, {
    timeout: 100,
    onSnapshotCreateLogs: console.log
});
```

### Managing Sandboxes

#### Get Sandbox by ID or Name

```typescript
const sandbox = await daytona.get('my-sandbox-id-or-name');
console.log(`Sandbox state: ${sandbox.state}`);
```

#### Find One Sandbox

```typescript
const sandbox = await daytona.findOne({ labels: { 'my-label': 'my-value' } });
console.log(`Sandbox ID: ${sandbox.id}, State: ${sandbox.state}`);
```

#### List Sandboxes

```typescript
const result = await daytona.list({ 'my-label': 'my-value' }, 2, 10);
for (const sandbox of result.items) {
    console.log(`${sandbox.id}: ${sandbox.state}`);
}
```

#### Start Sandbox

```typescript
const sandbox = await daytona.get('my-sandbox-id');
await daytona.start(sandbox, 60); // Wait up to 60 seconds
```

#### Stop Sandbox

```typescript
const sandbox = await daytona.get('my-sandbox-id');
await daytona.stop(sandbox);
```

#### Delete Sandbox

```typescript
const sandbox = await daytona.get('my-sandbox-id');
await daytona.delete(sandbox);
```

### Code Execution

#### Stateless Execution

```typescript
// Run TypeScript code
let response = await sandbox.process.codeRun(`
function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

console.log(greet("Daytona"));
`);
console.log(response.result);

// Run code with argv and environment variables
response = await sandbox.process.codeRun(
    `
    console.log(\`Hello, \${process.argv[2]}!\`);
    console.log(\`FOO: \${process.env.FOO}\`);
    `,
    {
      argv: ["Daytona"],
      env: { FOO: "BAR" }
    }
);
console.log(response.result);

// Run code with timeout
response = await sandbox.process.codeRun(
    'setTimeout(() => console.log("Done"), 2000);',
    undefined,
    5000
);
console.log(response.result);
```

### Process Execution

#### Execute Commands

```typescript
// Execute any shell command
const response = await sandbox.process.executeCommand("ls -la");
console.log(response.result);

// Setting a working directory and a timeout
const response2 = await sandbox.process.executeCommand("sleep 3", "workspace/src", undefined, 5);
console.log(response2.result);

// Passing environment variables
const response3 = await sandbox.process.executeCommand("echo $CUSTOM_SECRET", ".", {
    "CUSTOM_SECRET": "DAYTONA"
});
console.log(response3.result);
```

#### Background Processes (Sessions)

```typescript
// Check session's executed commands
const session = await sandbox.process.getSession(sessionId);
console.log(`Session ${sessionId}:`);
for (const command of session.commands) {
    console.log(`Command: ${command.command}, Exit Code: ${command.exitCode}`);
}

// List all running sessions
const sessions = await sandbox.process.listSessions();
for (const session of sessions) {
    console.log(`PID: ${session.id}, Commands: ${session.commands}`);
}
```

### File System Operations

#### List Files

```typescript
// List files in a directory
const files = await sandbox.fs.listFiles("workspace")

files.forEach(file => {
    console.log(`Name: ${file.name}`)
    console.log(`Is directory: ${file.isDir}`)
    console.log(`Size: ${file.size}`)
    console.log(`Modified: ${file.modTime}`)
})
```

#### Create Folder

```typescript
// Create with specific permissions
await sandbox.fs.createFolder("workspace/new-dir", "755")
```

#### Upload Files

```typescript
// Upload a single file
const fileContent = Buffer.from('Hello, World!')
await sandbox.fs.uploadFile(fileContent, "data.txt")

// Upload multiple files at once
const files = [
    {
        source: Buffer.from('Content of file 1'),
        destination: 'data/file1.txt',
    },
    {
        source: Buffer.from('Content of file 2'),
        destination: 'data/file2.txt',
    },
    {
        source: Buffer.from('{"key": "value"}'),
        destination: 'config/settings.json',
    }
]

await sandbox.fs.uploadFiles(files)
```

#### Download Files

```typescript
const downloadedFile = await sandbox.fs.downloadFile("file1.txt")
console.log('File content:', downloadedFile.toString())

// Download multiple files at once
const files = [
    { source: "data/file1.txt" }, // No destination - download to memory
    { source: "data/file2.txt", destination: "local_file2.txt" }, // Download to local file
]

const results = await sandbox.fs.downloadFiles(files)

results.forEach(result => {
    if (result.error) {
        console.error(`Error downloading ${result.source}: ${result.error}`)
    } else if (result.result) {
        console.log(`Downloaded ${result.source} to ${result.result}`)
    }
})
```

#### Delete Files

```typescript
await sandbox.fs.deleteFile("workspace/file.txt")
```

#### File Permissions

```typescript
// Set file permissions
await sandbox.fs.setFilePermissions("workspace/file.txt", { mode: "644" })

// Get file permissions
const fileInfo = await sandbox.fs.getFileDetails("workspace/file.txt")
console.log(`Permissions: ${fileInfo.permissions}`)
```

#### Search and Replace

```typescript
// Search for text in files; if a folder is specified, the search is recursive
const results = await sandbox.fs.findFiles({
    path: "workspace/src",
    pattern: "text-of-interest"
})
results.forEach(match => {
    console.log('Absolute file path:', match.file)
    console.log('Line number:', match.line)
    console.log('Line content:', match.content)
})

// Replace text in files
await sandbox.fs.replaceInFiles(
    ["workspace/file1.txt", "workspace/file2.txt"],
    "old_text",
    "new_text"
)
```

### Git Operations

#### Clone Repository

```typescript
// Basic clone
await sandbox.git.clone(
    "https://github.com/user/repo.git",
    "workspace/repo"
);

// Clone with authentication
await sandbox.git.clone(
    "https://github.com/user/repo.git",
    "workspace/repo",
    undefined,
    undefined,
    "git",
    "personal_access_token"
);

// Clone specific branch
await sandbox.git.clone(
    "https://github.com/user/repo.git",
    "workspace/repo",
    "develop"
);
```

#### Repository Status

```typescript
// Get repository status
const status = await sandbox.git.status("workspace/repo");
console.log(`Current branch: ${status.currentBranch}`);
console.log(`Commits ahead: ${status.ahead}`);
console.log(`Commits behind: ${status.behind}`);
status.fileStatus.forEach(file => {
    console.log(`File: ${file.name}`);
});

// List branches
const response = await sandbox.git.branches("workspace/repo");
response.branches.forEach(branch => {
    console.log(`Branch: ${branch}`);
});
```

#### Branch Operations

```typescript
// Create new branch
await sandbox.git.createBranch("workspace/repo", "feature/new-feature");

// Switch branch
await sandbox.git.checkoutBranch("workspace/repo", "feature/new-feature");

// Delete branch
await sandbox.git.deleteBranch("workspace/repo", "feature/old-feature");
```

#### Staging and Committing

```typescript
// Stage specific files
await sandbox.git.add("workspace/repo", ["file1.txt", "file2.txt"]);

// Stage all changes
await sandbox.git.add("workspace/repo", ["."]);

// Commit changes
await sandbox.git.commit("workspace/repo", "feat: add new feature", "John Doe", "john@example.com");
```

#### Remote Operations

```typescript
// Push changes
await sandbox.git.push("workspace/repo");

// Pull changes
await sandbox.git.pull("workspace/repo");
```

### Computer Use

#### Start Computer Use

```typescript
import { Daytona } from '@daytonaio/sdk';

const daytona = new Daytona();
const sandbox = await daytona.create();

// Start computer use processes
await sandbox.computerUse.start();

// Take a screenshot
const screenshot = await sandbox.computerUse.screenshot.takeFullScreen();

// Click and type
await sandbox.computerUse.mouse.click(100, 200);
await sandbox.computerUse.keyboard.type('Hello, Linux!');
await sandbox.computerUse.keyboard.hotkey('ctrl+s');
```

### Preview Links

#### Get Preview Link

```typescript
const previewInfo = await sandbox.getPreviewUrl(3000);

console.log(`Preview link url: ${previewInfo.url}`);
console.log(`Preview link token: ${previewInfo.token}`);
```

### Streaming Logs

#### Stream Logs with Callbacks

```typescript
import { Daytona, SessionExecuteRequest } from '@daytonaio/sdk'

async function main() {
    const daytona = new Daytona()
    const sandbox = await daytona.create()
    const sessionId = "exec-session-1"
    await sandbox.process.createSession(sessionId)

    const command = await sandbox.process.executeSessionCommand(
        sessionId,
        {
            command: 'for i in {1..5}; do echo "Step $i"; echo "Error $i" >&2; sleep 1; done',
            runAsync: true,
        },
    )

    // Stream logs with separate callbacks
    const logsTask = sandbox.process.getSessionCommandLogs(
        sessionId,
        command.cmdId!,
        (stdout) => console.log('[STDOUT]:', stdout),
        (stderr) => console.log('[STDERR]:', stderr),
    )

    console.log('Continuing execution while logs are streaming...')
    await new Promise((resolve) => setTimeout(resolve, 3000))
    console.log('Other operations completed!')

    // Wait for the logs to complete
    await logsTask

    await sandbox.delete()
}

main()
```

#### Retrieve All Existing Logs

```typescript
import { Daytona, SessionExecuteRequest } from '@daytonaio/sdk'

async function main() {
    const daytona = new Daytona()
    const sandbox = await daytona.create()
    const sessionId = "exec-session-1"
    await sandbox.process.createSession(sessionId)

    // Execute a blocking command and wait for the result
    const command = await sandbox.process.executeSessionCommand(
        sessionId,
        {
            command: 'echo "Hello from stdout" && echo "Hello from stderr" >&2',
        },
    )
    console.log(`[STDOUT]: ${command.stdout}`)
    console.log(`[STDERR]: ${command.stderr}`)
    console.log(`[OUTPUT]: ${command.output}`)

    // Or execute command in the background and get the logs later
    const command2 = await sandbox.process.executeSessionCommand(
        sessionId,
        {
            command: 'while true; do if (( RANDOM % 2 )); then echo "All good at $(date)"; else echo "Oops, an error at $(date)" >&2; fi; sleep 1; done',
            runAsync: true,
        },
    )
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Get the logs up to the current point in time
    const logs = await sandbox.process.getSessionCommandLogs(sessionId, command2.cmdId!)
    console.log(`[STDOUT]: ${logs.stdout}`)
    console.log(`[STDERR]: ${logs.stderr}`)
    console.log(`[OUTPUT]: ${logs.output}`)

    await sandbox.delete()
}

main()
```

### Declarative Image Building

#### Build Image On-Demand

```typescript
// Define a simple declarative image with packages
const declarativeImage = Image.debianSlim('3.12')
    .pipInstall(['requests', 'pytest'])
    .workdir('/home/daytona')

// Create a new Sandbox with the declarative image and stream the build logs
const sandbox = await daytona.create(
    {
        image: declarativeImage,
    },
    {
        timeout: 0,
        onSnapshotCreateLogs: console.log,
    }
)
```

#### Create Pre-built Snapshot

```typescript
// Create a simple data science image
const snapshotName = 'data-science-snapshot'

const image = Image.debianSlim('3.12')
    .pipInstall(['pandas', 'numpy'])
    .workdir('/home/daytona')

// Create the Snapshot and stream the build logs
await daytona.snapshot.create(
    {
        name: snapshotName,
        image,
    },
    {
        onLogs: console.log,
    }
)

// Create a new Sandbox using the pre-built Snapshot
const sandbox = await daytona.create({
    snapshot: snapshotName,
})
```

### Image Configuration

#### Base Image Selection

```typescript
// Create an image from a base
const image = Image.base('python:3.12-slim-bookworm')

// Use a Debian slim image with Python 3.12
const image = Image.debianSlim('3.12')
```

#### Package Management

```typescript
// Add pip packages
const image = Image.debianSlim('3.12').pipInstall(['requests', 'pandas'])

// Install from requirements.txt
const image = Image.debianSlim('3.12').pipInstallFromRequirements('requirements.txt')

// Install from pyproject.toml (with optional dependencies)
const image = Image.debianSlim('3.12').pipInstallFromPyproject('pyproject.toml', {
    optionalDependencies: ['dev']
})
```

#### File System Operations

```typescript
// Add a local file
const image = Image.debianSlim('3.12').addLocalFile('package.json', '/home/daytona/package.json')

// Add a local directory
const image = Image.debianSlim('3.12').addLocalDir('src', '/home/daytona/src')
```

#### Environment Configuration

```typescript
// Set environment variables
const image = Image.debianSlim('3.12').env({ PROJECT_ROOT: '/home/daytona' })

// Set working directory
const image = Image.debianSlim('3.12').workdir('/home/daytona')
```

#### Commands and Entrypoints

```typescript
// Run shell commands during build
const image = Image.debianSlim('3.12').runCommands(
    'apt-get update && apt-get install -y git',
    'groupadd -r daytona && useradd -r -g daytona -m daytona',
    'mkdir -p /home/daytona/workspace'
)

// Set entrypoint
const image = Image.debianSlim('3.12').entrypoint(['/bin/bash'])

// Set default command
const image = Image.debianSlim('3.12').cmd(['/bin/bash'])
```

#### Dockerfile Integration

```typescript
// Add custom Dockerfile commands
const image = Image.debianSlim('3.12').dockerfileCommands(['RUN echo "Hello, world!"'])

// Use an existing Dockerfile
const image = Image.fromDockerfile('Dockerfile')

// Extend an existing Dockerfile
const image = Image.fromDockerfile("app/Dockerfile").pipInstall(['numpy'])
```

### Network Configuration

#### Create Sandbox with Network Restrictions

```typescript
import { Daytona } from '@daytonaio/sdk'

const daytona = new Daytona()

// Allow access to specific IP addresses (Wikipedia, X/Twitter, private network)
const sandbox = await daytona.create({
    networkAllowList: '208.80.154.232/32,199.16.156.103/32,192.168.1.0/24'
})

// Or block all network access
const sandbox = await daytona.create({
    networkBlockAll: true
})
```

---

## API References

### Daytona Class

Main class for interacting with the Daytona API.

**Constructor:**

```typescript
new Daytona(config?: DaytonaConfig): Daytona
```

**Properties:**
- `snapshot: SnapshotService` - Service for managing Daytona Snapshots
- `volume: VolumeService` - Service for managing Daytona Volumes

**Methods:**

#### create()

Creates Sandboxes from specified or default snapshot.

```typescript
create(params?: CreateSandboxFromSnapshotParams, options?: {
    timeout: number;
}): Promise<Sandbox>
```

Or from an image:

```typescript
create(params?: CreateSandboxFromImageParams, options?: {
    onSnapshotCreateLogs: (chunk: string) => void;
    timeout: number;
}): Promise<Sandbox>
```

#### get()

Gets a Sandbox by its ID or name.

```typescript
get(sandboxIdOrName: string): Promise<Sandbox>
```

#### findOne()

Finds a Sandbox by its ID or name or labels.

```typescript
findOne(filter: SandboxFilter): Promise<Sandbox>
```

#### list()

Returns paginated list of Sandboxes filtered by labels.

```typescript
list(
    labels?: Record<string, string>,
    page?: number,
    limit?: number
): Promise<PaginatedSandboxes>
```

#### start()

Starts a Sandbox and waits for it to be ready.

```typescript
start(sandbox: Sandbox, timeout?: number): Promise<void>
```

#### stop()

Stops a Sandbox.

```typescript
stop(sandbox: Sandbox): Promise<void>
```

#### delete()

Deletes a Sandbox.

```typescript
delete(sandbox: Sandbox, timeout: number): Promise<void>
```

### DaytonaConfig Interface

Configuration options for initializing the Daytona client.

```typescript
interface DaytonaConfig {
    apiKey?: string;
    apiUrl?: string;
    jwtToken?: string;
    organizationId?: string;
    target?: string;
}
```

**Properties:**
- `apiKey?` - API key for authentication
- `apiUrl?` - URL of the Daytona API (default: 'https://app.daytona.io/api')
- `jwtToken?` - JWT token for authentication
- `organizationId?` - Organization ID for JWT-based authentication
- `target?` - Target location for Sandboxes

### CodeLanguage Enum

Supported programming languages for code execution.

```typescript
enum CodeLanguage {
    PYTHON = "python",
    TYPESCRIPT = "typescript",
    JAVASCRIPT = "javascript"
}
```

### CreateSandboxFromSnapshotParams

Parameters for creating a new Sandbox from a snapshot.

```typescript
interface CreateSandboxFromSnapshotParams {
    name?: string;
    language?: string;
    snapshot?: string;
    envVars?: Record<string, string>;
    labels?: Record<string, string>;
    public?: boolean;
    autoStopInterval?: number;
    autoArchiveInterval?: number;
    autoDeleteInterval?: number;
    volumes?: VolumeMount[];
    networkBlockAll?: boolean;
    networkAllowList?: string;
    ephemeral?: boolean;
    user?: string;
}
```

### CreateSandboxFromImageParams

Parameters for creating a new Sandbox from an image.

```typescript
interface CreateSandboxFromImageParams {
    name?: string;
    language?: string;
    image: string | Image;
    resources?: Resources;
    envVars?: Record<string, string>;
    labels?: Record<string, string>;
    public?: boolean;
    autoStopInterval?: number;
    autoArchiveInterval?: number;
    autoDeleteInterval?: number;
    volumes?: VolumeMount[];
    networkBlockAll?: boolean;
    networkAllowList?: string;
    ephemeral?: boolean;
    user?: string;
}
```

### Resources Interface

Resource allocation for a Sandbox.

```typescript
interface Resources {
    cpu?: number;    // CPU cores
    memory?: number; // Memory in GiB
    disk?: number;   // Disk space in GiB
    gpu?: number;    // GPU units
}
```

**Example:**

```typescript
const resources: Resources = {
    cpu: 2,
    memory: 4,  // 4GiB RAM
    disk: 20    // 20GiB disk
};
```

### Sandbox Interface

The Sandbox object represents an isolated execution environment.

**Key Properties:**
- `id: string` - Unique identifier
- `name: string` - Sandbox name
- `state: SandboxState` - Current state
- `language: CodeLanguage` - Programming language
- `fs: FileSystem` - File system operations
- `git: Git` - Git operations
- `process: Process` - Process execution
- `codeInterpreter: CodeInterpreter` - Stateful code interpreter
- `computerUse: ComputerUse` - Computer use functionality

### FileSystem Class

Provides file system operations within a Sandbox.

**Methods:**

#### listFiles()

```typescript
listFiles(path: string): Promise<FileInfo[]>
```

#### createFolder()

```typescript
createFolder(path: string, mode: string): Promise<void>
```

#### uploadFile()

```typescript
uploadFile(file: Buffer | string, remotePath: string, timeout?: number): Promise<void>
```

#### downloadFile()

```typescript
downloadFile(remotePath: string, timeout?: number): Promise<Buffer>
downloadFile(remotePath: string, localPath: string, timeout?: number): Promise<void>
```

#### deleteFile()

```typescript
deleteFile(path: string, recursive?: boolean): Promise<void>
```

#### findFiles()

```typescript
findFiles(path: string, pattern: string): Promise<Match[]>
```

#### replaceInFiles()

```typescript
replaceInFiles(files: string[], pattern: string, newValue: string): Promise<ReplaceResult[]>
```

### Git Class

Provides Git operations within a Sandbox.

**Methods:**

#### clone()

```typescript
clone(
    url: string,
    path: string,
    branch?: string,
    commitId?: string,
    username?: string,
    password?: string
): Promise<void>
```

#### status()

```typescript
status(path: string): Promise<GitStatus>
```

#### add()

```typescript
add(path: string, files: string[]): Promise<void>
```

#### commit()

```typescript
commit(
    path: string,
    message: string,
    author: string,
    email: string,
    allowEmpty?: boolean
): Promise<GitCommitResponse>
```

#### push()

```typescript
push(path: string, username?: string, password?: string): Promise<void>
```

#### pull()

```typescript
pull(path: string, username?: string, password?: string): Promise<void>
```

#### createBranch()

```typescript
createBranch(path: string, name: string): Promise<void>
```

#### checkoutBranch()

```typescript
checkoutBranch(path: string, branch: string): Promise<void>
```

#### deleteBranch()

```typescript
deleteBranch(path: string, name: string): Promise<void>
```

### Process Class

Handles process execution within a Sandbox.

**Methods:**

#### codeRun()

```typescript
codeRun(code: string, options?: CodeRunOptions, timeout?: number): Promise<ExecuteResponse>
```

#### executeCommand()

```typescript
executeCommand(
    command: string,
    cwd?: string,
    env?: Record<string, string>,
    timeout?: number
): Promise<ExecuteResponse>
```

#### createSession()

```typescript
createSession(sessionId: string): Promise<void>
```

#### getSession()

```typescript
getSession(sessionId: string): Promise<Session>
```

#### listSessions()

```typescript
listSessions(): Promise<Session[]>
```

#### executeSessionCommand()

```typescript
executeSessionCommand(
    sessionId: string,
    request: SessionExecuteRequest
): Promise<SessionCommandResponse>
```

#### getSessionCommandLogs()

```typescript
getSessionCommandLogs(
    sessionId: string,
    cmdId: string,
    onStdout?: (chunk: string) => void,
    onStderr?: (chunk: string) => void
): Promise<void>
```

### ComputerUse Class

Computer Use functionality for interacting with the desktop environment.

**Properties:**
- `display: Display` - Display operations
- `keyboard: Keyboard` - Keyboard operations
- `mouse: Mouse` - Mouse operations
- `screenshot: Screenshot` - Screenshot operations

**Methods:**

#### start()

```typescript
start(): Promise<ComputerUseStartResponse>
```

#### stop()

```typescript
stop(): Promise<ComputerUseStopResponse>
```

#### getStatus()

```typescript
getStatus(): Promise<ComputerUseStatusResponse>
```

#### getProcessStatus()

```typescript
getProcessStatus(processName: string): Promise<ProcessStatusResponse>
```

#### restartProcess()

```typescript
restartProcess(processName: string): Promise<ProcessRestartResponse>
```

#### getProcessLogs()

```typescript
getProcessLogs(processName: string): Promise<ProcessLogsResponse>
```

#### getProcessErrors()

```typescript
getProcessErrors(processName: string): Promise<ProcessErrorsResponse>
```

### Mouse Class

Mouse operations for computer use functionality.

**Methods:**

#### getPosition()

```typescript
getPosition(): Promise<MousePositionResponse>
```

#### move()

```typescript
move(x: number, y: number): Promise<MousePositionResponse>
```

#### click()

```typescript
click(
    x: number,
    y: number,
    button?: string,
    double?: boolean
): Promise<MouseClickResponse>
```

#### drag()

```typescript
drag(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    button?: string
): Promise<MouseDragResponse>
```

#### scroll()

```typescript
scroll(
    x: number,
    y: number,
    direction: "up" | "down",
    amount?: number
): Promise<boolean>
```

### Keyboard Class

Keyboard operations for computer use functionality.

**Methods:**

#### type()

```typescript
type(text: string, delay?: number): Promise<void>
```

#### press()

```typescript
press(key: string, modifiers?: string[]): Promise<void>
```

#### hotkey()

```typescript
hotkey(keys: string): Promise<void>
```

### Screenshot Class

Screenshot operations for computer use functionality.

**Methods:**

#### takeFullScreen()

```typescript
takeFullScreen(showCursor?: boolean): Promise<ScreenshotResponse>
```

#### takeRegion()

```typescript
takeRegion(region: ScreenshotRegion, showCursor?: boolean): Promise<ScreenshotResponse>
```

#### takeCompressed()

```typescript
takeCompressed(options?: ScreenshotOptions): Promise<ScreenshotResponse>
```

#### takeCompressedRegion()

```typescript
takeCompressedRegion(
    region: ScreenshotRegion,
    options?: ScreenshotOptions
): Promise<ScreenshotResponse>
```

### Display Class

Display operations for computer use functionality.

**Methods:**

#### getInfo()

```typescript
getInfo(): Promise<DisplayInfoResponse>
```

#### getWindows()

```typescript
getWindows(): Promise<WindowsResponse>
```

---

## Error Handling

### DaytonaError

Base error for Daytona SDK.

```typescript
class DaytonaError extends Error {
    headers?: AxiosHeaders;
    statusCode?: number;
}
```

### DaytonaNotFoundError

Error thrown when a resource is not found.

```typescript
class DaytonaNotFoundError extends DaytonaError {}
```

### DaytonaRateLimitError

Error thrown when rate limit is exceeded.

```typescript
class DaytonaRateLimitError extends DaytonaError {}
```

**Example:**

```typescript
try {
    await daytona.create()
} catch (error) {
    if (error instanceof DaytonaRateLimitError) {
        console.log(error.headers?.get('x-ratelimit-remaining-sandbox-create'))
        console.log(error.headers?.get('X-RateLimit-Remaining-Sandbox-Create')) // also works
    }
}
```

### DaytonaTimeoutError

Error thrown when a timeout occurs.

```typescript
class DaytonaTimeoutError extends DaytonaError {}
```

---

## Multiple Runtime Support

The Daytona TypeScript SDK works across multiple JavaScript runtimes including Node.js, Deno, Bun, browsers, and serverless platforms (Cloudflare Workers, AWS Lambda, Azure Functions, etc.).

### Daytona in Vite Projects

When using Daytona SDK in a Vite-based project, you need to configure node polyfills. Add the following to your `vite.config.ts`:

```typescript
import { nodePolyfills } from 'vite-plugin-node-polyfills'

plugins: [
    // ... other plugins
    nodePolyfills({
        globals: { global: true, process: true, Buffer: true },
        overrides: {
            path: 'path-browserify-win32',
        },
    }),
],
```

### Daytona in Next.js Projects

When using Daytona SDK in a Next.js project, add the following configuration to your `next.config.ts`:

```typescript
import type { NextConfig } from 'next'
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin'
import { env, nodeless } from 'unenv'

const { alias: turbopackAlias } = env(nodeless, {})

const nextConfig: NextConfig = {
    // Turbopack
    experimental: {
        turbo: {
            resolveAlias: {
                ...turbopackAlias,
            },
        },
    },
    // Webpack
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.plugins.push(new NodePolyfillPlugin())
        }
        return config
    },
}
```

---

## Complete Examples

### AI Data Analysis with Daytona

```typescript
import "dotenv/config";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { Daytona, Sandbox } from "@daytonaio/sdk";
import type {
    MessageParam,
    Tool,
    ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages.mjs";

interface CodeRunToolInput {
    code: string;
}

interface ExecutionResult {
    stdout: string;
    exitCode: number;
    charts?: Array<{ png?: string }>;
}

async function main() {
    // Create sandbox
    const daytona = new Daytona();
    const sandbox = await daytona.create();

    // Upload the dataset to the sandbox
    await sandbox.fs.uploadFile("dataset.csv", "/home/daytona/dataset.csv");

    const initialPrompt = `
I have a CSV file with vehicle valuations saved in the sandbox at /home/daytona/dataset.csv.

Relevant columns:
- 'year': integer, the manufacturing year of the vehicle
- 'price_in_euro': float, the listed price of the vehicle in Euros

Analyze how price varies by manufacturing year.
Drop rows where 'year' or 'price_in_euro' is missing, non-numeric, or an outlier.
Create a line chart showing average price per year.
Write code that analyzes the dataset based on my request and produces a matplotlib chart accordingly.
Always finish with plt.show() to display the chart.`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const tools: Tool[] = [
        {
            name: "run_code",
            description: "Run code in the sandbox environment and get execution results",
            input_schema: {
                type: "object",
                properties: {
                    code: {
                        type: "string",
                        description: "The code to run",
                    },
                },
                required: ["code"],
            },
        },
    ];

    // Initialize conversation history
    const messages: MessageParam[] = [
        { role: "user", content: initialPrompt },
    ];

    let continueLoop = true;
    let iterationCount = 0;
    const maxIterations = 10;

    console.log("Starting agentic loop...\n");

    while (continueLoop && iterationCount < maxIterations) {
        iterationCount++;
        console.log(`\n=== Iteration ${iterationCount} ===`);
        console.log("Waiting for the model response...");

        // Get response from Claude
        const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-5",
            max_tokens: 64000,
            messages: messages,
            tools: tools,
        });

        const message = await stream.finalMessage();

        // Log Claude's text response
        for (const contentBlock of message.content) {
            if (contentBlock.type === "text") {
                console.log("\nClaude's response:");
                console.log(contentBlock.text);
            }
        }

        // Check if Claude wants to use any tools
        const toolUses = message.content.filter(
            (block): block is ToolUseBlock => block.type === "tool_use"
        );

        if (toolUses.length === 0) {
            // No more tool uses, Claude is done
            console.log("\nTask completed - no more actions needed.");
            continueLoop = false;
            break;
        }

        // Add Claude's response to message history
        messages.push({
            role: "assistant",
            content: message.content,
        });

        // Execute all tool calls and collect results
        const toolResults = [];

        for (const toolUse of toolUses) {
            if (toolUse.name === "run_code") {
                const code = (toolUse.input as CodeRunToolInput).code;
                console.log("\n--- Executing code in sandbox ---");
                console.log(code);
                console.log("--- End of code ---\n");

                // Execute the code in the sandbox
                const executionResult = await runAIGeneratedCode(sandbox, code);

                // Format the tool result
                let resultContent = "";
                if (executionResult.exitCode === 0) {
                    resultContent += "Execution successful!\n\n";
                    if (executionResult.stdout) {
                        resultContent += `Output:\n${executionResult.stdout}\n`;
                    }
                    if (executionResult.charts && executionResult.charts.length > 0) {
                        resultContent += `\nGenerated ${executionResult.charts.length} chart(s).`;
                    } else {
                        resultContent += "\nNote: No charts were generated. Make sure to use plt.show() to display the chart.";
                    }
                } else {
                    resultContent += `Execution failed with exit code ${executionResult.exitCode}\n\n`;
                    if (executionResult.stdout) {
                        resultContent += `Output:\n${executionResult.stdout}\n`;
                    }
                }

                toolResults.push({
                    type: "tool_result" as const,
                    tool_use_id: toolUse.id,
                    content: resultContent,
                });

                console.log("Execution result sent back to Claude.");
            }
        }

        // Add tool results to conversation history
        messages.push({
            role: "user",
            content: toolResults,
        });
    }

    if (iterationCount >= maxIterations) {
        console.log("\n Warning: Reached maximum iteration limit. Task may not be complete.");
    }

    console.log("\n=== Agentic loop completed ===");
}

async function runAIGeneratedCode(
    sandbox: Sandbox,
    aiGeneratedCode: string
): Promise<ExecutionResult> {
    const execution = await sandbox.process.codeRun(aiGeneratedCode);

    const result: ExecutionResult = {
        stdout: execution.result || "",
        exitCode: execution.exitCode,
        charts: execution.artifacts?.charts,
    };

    // Save any charts that were generated
    if (execution.artifacts?.charts) {
        let resultIdx = 0;
        for (const chart of execution.artifacts.charts) {
            if (chart.png) {
                const filename = `chart-${resultIdx}.png`;
                fs.writeFileSync(filename, chart.png, {
                    encoding: "base64",
                });
                console.log(`Chart saved to ${filename}`);
                resultIdx++;
            }
        }
    }

    return result;
}

main().catch(console.error);
```

### Flask App Preview Example

```typescript
import { Daytona } from '@daytonaio/sdk';

const daytona = new Daytona(({
    apiKey: "YOUR_API_KEY"
}));

async function main() {
    const sandbox = await daytona.create();

    const appCode = Buffer.from(`
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Hello World</title>
        <link rel="icon" href="https://www.daytona.io/favicon.ico">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 2rem; border-radius: 10px; background-color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <img src="https://raw.githubusercontent.com/daytonaio/daytona/main/assets/images/Daytona-logotype-black.png" alt="Daytona Logo" style="width: 180px; margin: 10px 0px;">
            <p>This web app is running in a Daytona sandbox!</p>
        </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
    `);

    // Save the Flask app to a file
    await sandbox.fs.uploadFile(appCode, "app.py");

    // Create a new session and execute a command
    const execSessionId = "app-session";
    await sandbox.process.createSession(execSessionId);

    await sandbox.process.executeSessionCommand(execSessionId, ({
        command: `python app.py`,
        async: true,
    }));

    // Get the preview link for the app
    const previewInfo = await sandbox.getPreviewLink(3000);
    console.log(`App is available at: ${previewInfo.url}`);
}

main().catch(error => console.error("Error:", error));
```
