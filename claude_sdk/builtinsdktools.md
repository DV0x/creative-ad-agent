# Built-in Research Tools in Claude SDK

*No MCP needed - these tools come standard with Claude SDK*

## 1. WebFetch - Web Content Analysis
- Fetches content from any URL
- Processes it with AI to extract insights
- Perfect for analyzing websites, competitor pages, documentation

## 2. WebSearch - Web Search Engine
- Searches the web for information
- Can filter by domains (allowed/blocked)
- Returns formatted search results
- Great for finding industry trends, competitor info, market research

## 3. Grep - Pattern Recognition & Search
- Powerful regex search across files/content
- Supports multiline patterns
- Can search with context lines (-A/-B/-C)
- Perfect for finding patterns in scraped data

## 4. Glob - File Pattern Matching
- Fast file discovery by patterns
- Works with wildcards (`*.txt`, `**/*.js`)
- Useful for organizing research data

## 5. Read - Multi-format File Reader
- Reads text files, images, PDFs, notebooks
- Can process visual content (multimodal)
- Extracts both text and visual information

## 6. Task - Subagent Delegation
- Delegates complex research to specialized subagents
- Enables parallel research execution
- Maintains separate context for focused tasks

## 7. TodoWrite - Task Management
- Tracks research progress
- Organizes multi-step investigations
- Maintains task state

## 8. Bash - System Commands
- Can run command-line tools
- Execute scripts for data processing
- Persistent shell sessions for complex workflows

---

## How These Tools Enable Meta Ads Research

### For Brand Analysis:
- **WebFetch** → Analyze client website, extract brand voice, products, audience
- **Read** → Process brand guidelines, marketing materials
- **Built-in AI** → Synthesize brand profile

### For Competitor Research:
- **WebSearch** → Find competitor domains and campaigns
- **WebFetch** → Analyze competitor websites for messaging
- **Grep** → Extract patterns from collected data
- **Built-in AI** → Identify winning strategies

### For Trend Analysis:
- **WebSearch** → Research industry trends and news
- **WebFetch** → Deep-dive into trending topics
- **Built-in AI** → Synthesize market opportunities

### For Pattern Recognition:
- **Grep** → Find recurring themes in data
- **Built-in AI** → Identify successful messaging patterns
- **Task** → Delegate pattern analysis to specialized subagents

---

> These built-in tools provide everything needed for the research phase without any external dependencies or MCP servers!