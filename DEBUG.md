## Observations

- User reported `/api/chat` returning 200 while the chat UI stayed on "Tentu, saya cari dulu ya" for the query `coba list documents gw`.
- Next dev logs show the request eventually logged `stream:finish`, persisted an assistant message, and logged `request:finish`.
- The persisted assistant message had `responseLength: 24`, matching a short preamble instead of a real document list.
- Refreshing the page shows tool calls/traces because persisted `chat_tool_calls` are reloaded by the server view model after the request finishes.
- Live chat state only receives transient `data-status` labels, not durable tool call objects, so the timeline is unavailable until refresh.
- The failed tool calls in `chat_tool_calls` report `result.map is not a function` for `hybridSearch` and `retrieveChunks`.
- There is no assistant tool that directly lists uploaded documents, so the model guessed with retrieval tools and `listDestinations`.

## Hypotheses

### H1: Raw SQL retrieval functions treat Drizzle query results as arrays (ROOT HYPOTHESIS)

- Supports: persisted tool call errors say `result.map is not a function`; retrieval modules cast `getDatabase().execute(...)` directly to arrays.
- Conflicts: tools that do not use raw SQL, like `listDestinations`, succeed.
- Test: normalize raw SQL `execute` results to `rows` and run retrieval tests.

### H2: The chat UI only displays persisted tool calls after refresh

- Supports: refresh shows traces; live stream only exposes `streamStatus`.
- Conflicts: live status labels do appear, so streaming itself works.
- Test: add live tool event state from `data-status` and render it while streaming.

### H3: The agent lacks a direct document inventory tool

- Supports: registry has retrieval, facts, tariffs, destinations, but no `listDocuments`.
- Conflicts: document admin page can list documents through DB query.
- Test: add `listDocuments` tool and update registry tests.

## Experiments

- Querying `chat_tool_calls` for the affected session confirmed `hybridSearch` and `retrieveChunks` failed with `result.map is not a function`.
- Next logs confirmed the request completed and persisted a 24-character assistant answer.

## Root Cause

The behavior is a combination of raw SQL retrieval failures, missing direct document-listing capability, and live UI state that does not render tool calls until the server refresh reloads persisted tool calls.

## Fix

- Normalize Drizzle raw SQL execution results before mapping retrieval rows.
- Add a first-class `listDocuments` assistant tool.
- Keep live tool event history in `useChatStream` and render it while streaming.
