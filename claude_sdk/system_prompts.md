# Modifying system prompts

> Learn how to customize Claude's behavior by modifying system prompts using three approaches - output styles, systemPrompt with append, and custom system prompts.

System prompts define Claude's behavior, capabilities, and response style. The Claude Agent SDK provides three ways to customize system prompts: using output styles (persistent, file-based configurations), appending to Claude Code's prompt, or using a fully custom prompt.

## Understanding system prompts

A system prompt is the initial instruction set that shapes how Claude behaves throughout a conversation.

<Note>
  **Default behavior:** The Agent SDK uses an **empty system prompt** by default for maximum flexibility. To use Claude Code's system prompt (tool instructions, code guidelines, etc.), specify `systemPrompt: { preset: "claude_code" }` in TypeScript or `system_prompt="claude_code"` in Python.
</Note>

Claude Code's system prompt includes:

* Tool usage instructions and available tools
* Code style and formatting guidelines
* Response tone and verbosity settings
* Security and safety instructions
* Context about the current working directory and environment

## Methods of modification

### Method 1: Output styles (persistent configurations)

Output styles are saved configurations that modify Claude's system prompt. They're stored as markdown files and can be reused across sessions and projects.

#### Creating an output style

<CodeGroup>
  ```typescript TypeScript
  import { writeFile, mkdir } from 'fs/promises'
  import { join } from 'path'
  import { homedir } from 'os'

  async function createOutputStyle(name: string, description: string, prompt: string) {
    // User-level: ~/.claude/output-styles
    // Project-level: .claude/output-styles
    const outputStylesDir = join(homedir(), '.claude', 'output-styles')
    
    await mkdir(outputStylesDir, { recursive: true })
    
    const content = `---
  name: ${name}
  description: ${description}
  ---

  ${prompt}`
    
    const filePath = join(outputStylesDir, `${name.toLowerCase().replace(/\s+/g, '-')}.md`)
    await writeFile(filePath, content, 'utf-8')
  }

  // Example: Create a code review specialist
  await createOutputStyle(
    'Code Reviewer',
    'Thorough code review assistant',
    `You are an expert code reviewer.

  For every code submission:
  1. Check for bugs and security issues
  2. Evaluate performance
  3. Suggest improvements
  4. Rate code quality (1-10)`
  )
  ```

  ```python Python
  from pathlib import Path

  async def create_output_style(name: str, description: str, prompt: str):
      # User-level: ~/.claude/output-styles
      # Project-level: .claude/output-styles
      output_styles_dir = Path.home() / '.claude' / 'output-styles'
      
      output_styles_dir.mkdir(parents=True, exist_ok=True)
      
      content = f"""---
  name: {name}
  description: {description}
  ---

  {prompt}"""
      
      file_name = name.lower().replace(' ', '-') + '.md'
      file_path = output_styles_dir / file_name
      file_path.write_text(content, encoding='utf-8')

  # Example: Create a code review specialist
  await create_output_style(
      'Code Reviewer',
      'Thorough code review assistant',
      """You are an expert code reviewer.

  For every code submission:
  1. Check for bugs and security issues
  2. Evaluate performance
  3. Suggest improvements
  4. Rate code quality (1-10)"""
  )
  ```
</CodeGroup>

#### Using output styles

Once created, activate output styles via:

* **CLI**: `/output-style [style-name]`
* **Settings**: `.claude/settings.local.json`
* **Create new**: `/output-style:new [description]`

### Method 2: Using `systemPrompt` with append

You can use the Claude Code preset with an `append` property to add your custom instructions while preserving all built-in functionality.

<CodeGroup>
  ```typescript TypeScript
  import { query } from "@anthropic-ai/claude-agent-sdk"

  const messages = []

  for await (const message of query({
    prompt: "Help me write a Python function to calculate fibonacci numbers",
    options: {
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: "Always include detailed docstrings and type hints in Python code."
      }
    }
  })) {
    messages.push(message)
    if (message.type === 'assistant') {
      console.log(message.message.content)
    }
  }
  ```

  ```python Python
  from claude_agent_sdk import query, ClaudeAgentOptions

  messages = []

  async for message in query(
      prompt="Help me write a Python function to calculate fibonacci numbers",
      options=ClaudeAgentOptions(
          system_prompt={
              "type": "preset",
              "preset": "claude_code",
              "append": "Always include detailed docstrings and type hints in Python code."
          }
      )
  ):
      messages.append(message)
      if message.type == 'assistant':
          print(message.message.content)
  ```
</CodeGroup>

### Method 3: Custom system prompts

You can provide a custom string as `systemPrompt` to replace the default entirely with your own instructions.

<CodeGroup>
  ```typescript TypeScript
  import { query } from "@anthropic-ai/claude-agent-sdk"

  const customPrompt = `You are a Python coding specialist.
  Follow these guidelines:
  - Write clean, well-documented code
  - Use type hints for all functions
  - Include comprehensive docstrings
  - Prefer functional programming patterns when appropriate
  - Always explain your code choices`

  const messages = []

  for await (const message of query({
    prompt: "Create a data processing pipeline",
    options: {
      systemPrompt: customPrompt
    }
  })) {
    messages.push(message)
    if (message.type === 'assistant') {
      console.log(message.message.content)
    }
  }
  ```

  ```python Python
  from claude_agent_sdk import query, ClaudeAgentOptions

  custom_prompt = """You are a Python coding specialist.
  Follow these guidelines:
  - Write clean, well-documented code
  - Use type hints for all functions
  - Include comprehensive docstrings
  - Prefer functional programming patterns when appropriate
  - Always explain your code choices"""

  messages = []

  async for message in query(
      prompt="Create a data processing pipeline",
      options=ClaudeAgentOptions(
          system_prompt=custom_prompt
      )
  ):
      messages.append(message)
      if message.type == 'assistant':
          print(message.message.content)
  ```
</CodeGroup>

## Comparison of all three approaches

| Feature                 | Output Styles      | `systemPrompt` with append | Custom `systemPrompt`    |
| ----------------------- | ------------------ | -------------------------- | ------------------------ |
| **Persistence**         | ✅ Saved as files   | ❌ Session only             | ❌ Session only           |
| **Reusability**         | ✅ Across projects  | ❌ Code duplication         | ❌ Code duplication       |
| **Management**          | ✅ CLI + files      | ⚠️ In code                 | ⚠️ In code               |
| **Default tools**       | ✅ Preserved        | ✅ Preserved                | ❌ Lost (unless included) |
| **Built-in safety**     | ✅ Maintained       | ✅ Maintained               | ❌ Must be added          |
| **Environment context** | ✅ Automatic        | ✅ Automatic                | ❌ Must be provided       |
| **Customization level** | ⚠️ Replace default | ⚠️ Additions only          | ✅ Complete control       |
| **Version control**     | ✅ Yes              | ✅ With code                | ✅ With code              |
| **Discovery**           | ✅ `/output-style`  | ❌ Not discoverable         | ❌ Not discoverable       |

**Note:** "With append" means using `systemPrompt: { type: "preset", preset: "claude_code", append: "..." }` in TypeScript or `system_prompt={"type": "preset", "preset": "claude_code", "append": "..."}` in Python.

## Use cases and best practices

### When to use output styles

**Best for:**

* Persistent behavior changes across sessions
* Team-shared configurations
* Specialized assistants (code reviewer, data scientist, DevOps)
* Complex prompt modifications that need versioning

**Examples:**

* Creating a dedicated SQL optimization assistant
* Building a security-focused code reviewer
* Developing a teaching assistant with specific pedagogy

### When to use `systemPrompt` with append

**Best for:**

* Adding specific coding standards or preferences
* Customizing output formatting
* Adding domain-specific knowledge
* Modifying response verbosity
* Enhancing Claude Code's default behavior without losing tool instructions

### When to use custom `systemPrompt`

**Best for:**

* Complete control over Claude's behavior
* Specialized single-session tasks
* Testing new prompt strategies
* Situations where default tools aren't needed
* Building specialized agents with unique behavior

## Combining approaches

You can combine these methods for maximum flexibility:

### Example: Output style with session-specific additions

<CodeGroup>
  ```typescript TypeScript
  import { query } from "@anthropic-ai/claude-agent-sdk"

  // Assuming "Code Reviewer" output style is active (via /output-style)
  // Add session-specific focus areas
  const messages = []

  for await (const message of query({
    prompt: "Review this authentication module",
    options: {
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: `
          For this review, prioritize:
          - OAuth 2.0 compliance
          - Token storage security
          - Session management
        `
      }
    }
  })) {
    messages.push(message)
  }
  ```

  ```python Python
  from claude_agent_sdk import query, ClaudeAgentOptions

  # Assuming "Code Reviewer" output style is active (via /output-style)
  # Add session-specific focus areas
  messages = []

  async for message in query(
      prompt="Review this authentication module",
      options=ClaudeAgentOptions(
          system_prompt={
              "type": "preset",
              "preset": "claude_code",
              "append": """
              For this review, prioritize:
              - OAuth 2.0 compliance
              - Token storage security
              - Session management
              """
          }
      )
  ):
      messages.append(message)
  ```
</CodeGroup>

## See also

* [Output styles](/en/docs/claude-code/output-styles) - Complete output styles documentation
* [TypeScript SDK guide](/en/api/agent-sdk/typescript) - Complete SDK usage guide
* [TypeScript SDK reference](/en/docs/claude-code/typescript-sdk-reference) - Full API documentation
* [Configuration guide](/en/docs/claude-code/configuration) - General configuration options
