> ## Documentation Index
> Fetch the complete documentation index at: https://docs.perplexity.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Prompt Guide

> How to write effective prompts for the Agent API.

The Agent API runs a bounded multi-turn loop: on each turn the model can call a tool (such as `web_search`), read the result, and decide whether to continue or answer. Prompts that work well with single-shot LLMs often underperform here, because the same text shapes tool selection, search query generation, and final response together.

Two parameters drive most of the prompt design:

* **`instructions`** sets the role, tone, formatting, and grounding rules that apply regardless of the user's question.
* **`input`** holds the actual question. It also seeds the first search query, so specificity here directly improves retrieval.

For hard constraints on retrieval (allowed domains, date ranges, region) and on the loop itself (max steps), use request parameters rather than prose. The sections below cover when to reach for each.

## Instructions

Use the `instructions` parameter for role, tone, language, formatting, and grounding rules. Instructions apply on every turn of the agent loop, so put things here that hold regardless of the user's question.

<Warning>
  Setting `instructions` with a preset **replaces** the preset's system prompt — it does not append. Each preset (`fast-search`, `pro-search`, `deep-research`) already covers tool-call discipline, query construction, citation, and formatting, so the preset's prompt should be overridden only when app-specific behavior is needed. Without a preset, `instructions` is the only system prompt the model sees.
</Warning>

**Example instructions block:**

```text Instructions theme={null}
You are a financial analyst writing for retail investors.

Rules:
- Aim for brief sentences and paragraphs.
- Define jargon the first time you use it.
- Prefer concrete numbers over vague qualifiers ("up 12% YoY" not "growing
  strongly").

Grounding rules:
- Cite sources inline by domain, e.g. (reuters.com). Do not write full URLs.
- If searches return no relevant results after trying alternative phrasings,
  or if the only matches are off-topic (different company, different fiscal year,
  etc.), say so explicitly rather than substituting related results.
```

Keep `instructions` focused. They are re-read on every turn of the agent loop, so bloat compounds across tool calls. If your block is growing long, check whether parts of it would be better expressed as request parameters: use [`response_format`](/docs/agent-api/output-control) with a JSON schema for machine-readable output, [`web_search` filters](/docs/agent-api/filters) for retrieval constraints, or move query-specific framing into `input`.

Built-in tools like `web_search` and `fetch_url` are tuned to work well without prompt-side guidance. You don't need to describe what they do, when to call them, or how to construct queries. Adjust tool-call count with the `max_steps` parameter and search constraints with `web_search` filters. If you're using custom `instructions` and want to nudge how the model uses built-in tools, you can reference them there as well.

For custom function tools you define yourself, the model relies on the `description` and parameter schema you provide, so make those as clear as you can. You can reinforce the tool's role in `instructions` if the description alone isn't enough to steer behavior.

## Input

Use the `input` parameter for the actual query you want answered. Input strongly shapes search behavior, so descriptive and specific phrasing directly improves retrieval. Vague inputs lead to vague searches.

**Example user prompt:**

```text Input theme={null}
What are the best sushi restaurants in the world currently?
```

## API Example

<CodeGroup>
  ```python Python theme={null}
  from perplexity import Perplexity

  client = Perplexity()

  response = client.responses.create(
      preset="pro-search",
      input="What are the best sushi restaurants in the world currently?",
      instructions="You are a concise, well-researched assistant. If searches still return no relevant results after trying alternative phrasings, say so explicitly rather than guessing."
  )

  print(response.output_text)
  ```

  ```typescript Typescript theme={null}
  import Perplexity from '@perplexity-ai/perplexity_ai';

  const client = new Perplexity();

  const response = await client.responses.create({
    preset: "pro-search",
    input: "What are the best sushi restaurants in the world currently?",
    instructions: "You are a concise, well-researched assistant. If searches still return no relevant results after trying alternative phrasings, say so explicitly rather than guessing."
  });

  console.log(response.output_text);
  ```

  ```bash cURL theme={null}
  curl https://api.perplexity.ai/v1/agent \
    -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "preset": "pro-search",
      "input": "What are the best sushi restaurants in the world currently?",
      "instructions": "You are a concise, well-researched assistant. If searches still return no relevant results after trying alternative phrasings, say so explicitly rather than guessing."
    }' | jq
  ```
</CodeGroup>

## Best Practices

<CardGroup cols={3}>
  <Card title="Be Specific and Descriptive">
    Use natural language, but include the vocabulary and context that would actually appear on relevant pages. Add a few words of context to disambiguate when a term could mean multiple things. Specificity in `input` directly improves retrieval.

    **Good Example**: "Compare energy efficiency ratings of heat pumps vs. traditional HVAC for residential use"

    **Poor Example**: "Tell me which home heating is better"
  </Card>

  <Card title="Cap Result Counts">
    If you want a list, say how long. Without an explicit cap, the model picks an arbitrary length.

    **Good Example**: "List the top 5 sushi restaurants in Tokyo"

    **Poor Example**: "Give me a list of sushi restaurants"
  </Card>

  <Card title="Use Instructions to Shape Tool Output">
    Can be useful if you want to nudge how the model handles tool output. Things like citation style, grounding behavior, or response formatting fit naturally here, since instructions apply on every turn of the agent loop.

    **Example** (`instructions`): "Cite sources inline by domain (e.g., reuters.com). State explicitly when tool results don't fully answer the question."
  </Card>
</CardGroup>

## Reading Sources from the Response

Read URLs and source metadata from the response payload, not from the model's written answer. For non-streaming responses, search results are available at the top level as `response.search_results` and inside `response.output[]` as items where `type == "search_results"` (both carry the same data). Pull URLs from `results[].url`. For streaming, listen for `response.reasoning.search_results` events. See [Output Control](/docs/agent-api/output-control) for the full response shape.

The model has access to URLs from tool output and can include them in its response if asked, but it's prone to mistyping or paraphrasing them. Presets also configure the model to cite by index (e.g., `[web:1]`), not by URL, so asking for URLs in prose fights the default citation format. Treat the model's text as the prose answer and the structured `search_results` field as the authoritative source list.

## Reduce Hallucinations

LLMs are tuned to be helpful, which can occasionally lead them to provide an answer when search results are thin or off-target rather than flagging the gap. The agent loop helps, since the model can refine queries and search again, but it does not eliminate the failure modes. Hallucination is most likely when the information isn't web-accessible (LinkedIn posts, private documents, paywalled content), when repeated searches return related but non-matching results, or when very recent information isn't indexed yet.

A few short additions to `instructions` cover most of these cases. Grounding rules belong here because instructions are re-read on every turn of the agent loop, so the same rule applies to the first search and to any follow-ups.

**Give the model permission to say it didn't find anything.** With an explicit out, the model is more likely to acknowledge insufficient results instead of leaning on training data to fill the gap.

```text Instructions theme={null}
If searches do not return relevant results after trying alternative phrasings, say so explicitly rather than providing speculative information.
```

**Require disclosure of near-misses.** When search returns related but non-matching results (a different year, a parent company instead of a subsidiary, a similar product), asking the model to surface the mismatch up front keeps these cases from being presented as direct answers.

```text Instructions theme={null}
If you find related but non-matching results (for example, a different year, a parent company, or a subsidiary), state the mismatch explicitly before answering.
```

## Use Parameters, Not Prose, for Hard Constraints

For source, date, or region constraints, prefer the `web_search` parameters over describing the constraint in prose. Parameters are applied by the search backend on every call, while prose-based filters are interpreted by the model and may not carry through every turn of the loop.

Keep `input` focused on the question itself, and move structural constraints into the tool config:

```python Avoid theme={null}
client.responses.create(
    preset="pro-search",
    input="Search only on Wikipedia for climate change policies from the past month."
)
```

```python Prefer theme={null}
client.responses.create(
    preset="pro-search",
    input="What are the latest climate change policies?",
    tools=[
        {
            "type": "web_search",
            "filters": {
                "search_domain_filter": ["wikipedia.org"],
                "search_recency_filter": "month"
            }
        }
    ]
)
```

See [Filters](/docs/agent-api/filters) for the full list of available parameters.

<Tip>
  To run without tools, set `tools_disabled: true` on the request. Passing `tools: []` does **not** clear preset tools. An empty array is treated the same as omitting the field, and the preset's defaults still apply.
</Tip>

## Next Steps

<CardGroup cols={2}>
  <Card title="Output Control" icon="sliders" href="/docs/agent-api/output-control">
    Shape responses with `response_format` and learn the full response payload structure.
  </Card>

  <Card title="Filters" icon="magnifying-glass" href="/docs/agent-api/filters">
    Constrain search with domain, recency, and region parameters.
  </Card>

  <Card title="Tools" icon="code" href="/docs/agent-api/tools">
    Configure `web_search` and other tools available to the Agent API.
  </Card>

  <Card title="Presets" icon="layer-group" href="/docs/agent-api/presets">
    Choose a preset that matches your latency, depth, and tool requirements.
  </Card>
</CardGroup>
