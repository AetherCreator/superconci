# Clue 6: Story Engine — Procedural + AI Hybrid

## Mission
Build the core story engine that plays a story pack segment by segment, handling both procedural playback and AI streaming moments. This is the brain of Story Quest — get it right and everything downstream works.

## Context
- Story packs define segments as either `procedural` or `ai_moment` (Clue 2)
- Procedural segments are read from SQLite pack data and played locally
- AI moments stream from Claude API using the delimiter pattern
- The engine doesn't render anything — it provides text and choices to the StoryPlayer (Clue 8)
- Full story history is maintained for AI context injection
- Max 20 segments per story, then Claude wraps up

## Design Decisions (Locked)
- **Streaming:** Delimiter pattern — stream plain text, `---CHOICES---`, then JSON
- **Token strategy:** Only 3-4 AI calls per story (pack-defined AI moments only)
- **History:** Rolling full history (20 segments max = ~6000 tokens ceiling, acceptable)
- **Save timing:** After choice selection (confirmed state) — handled by Clue 9, not here

## Build

### File: `src/games/story-quest/engine/StoryEngine.js`

**Core class/module:**

```javascript
class StoryEngine {
  constructor({ storyId, packId, heroData, onSegment, onChoices, onError }) {
    // storyId: active story ID (from SQLite)
    // packId: which pack we're playing
    // heroData: { name, description, pronoun, possessive }
    // onSegment: callback(text) — called as text streams/appears
    // onChoices: callback(choices, allowFreeText) — called when choices ready
    // onError: callback(error) — called on failures
  }

  // Start or resume a story from a specific segment
  async playSegment(segmentId) {
    const packSegment = await getPackSegment(this.packId, segmentId);

    if (packSegment.type === 'procedural') {
      await this.playProcedural(packSegment);
    } else if (packSegment.type === 'ai_moment') {
      await this.playAIMoment(packSegment);
    }
  }

  // Handle procedural segment
  async playProcedural(segment) {
    const text = injectHero(segment.text, this.heroData);
    const choices = JSON.parse(segment.choices);
    this.onSegment(text);
    this.onChoices(choices, false);
    this.addToHistory(text, 'pack');
  }

  // Handle AI streaming moment
  async playAIMoment(segment) {
    try {
      const result = await this.streamFromAPI(segment);
      this.addToHistory(result.text, 'ai');
      // Choices delivered via onChoices during stream handling
    } catch (error) {
      // Fallback to pack data
      await this.playFallback(segment);
    }
  }

  // Play the offline/error fallback for an AI moment
  async playFallback(segment) {
    const fallback = segment.fallback;
    const text = injectHero(fallback.text, this.heroData);
    const choices = JSON.parse(fallback.choices);
    this.onSegment(text);
    this.onChoices(choices, false);
    this.addToHistory(text, 'fallback');
  }

  // Process a choice and advance
  async selectChoice(choiceIndex, segmentType, currentSegment) {
    let nextSegmentId;

    if (segmentType === 'procedural') {
      const nextMap = JSON.parse(currentSegment.next_map);
      nextSegmentId = nextMap[String(choiceIndex)];
    } else {
      // AI moment — resolve via branchHints
      nextSegmentId = resolveBranch(choiceText, currentSegment.branchHints);
    }

    if (currentSegment.isEnding) {
      this.onStoryComplete();
      return;
    }

    this.segmentCount++;
    if (this.segmentCount >= 20) {
      // Trigger wrap-up
      await this.playWrapUp();
      return;
    }

    await this.playSegment(nextSegmentId);
  }

  // Handle free text input at AI moments
  async submitFreeText(userText) {
    // userText gets incorporated into the next AI call
    this.pendingFreeText = userText;
    this.addToHistory(`[${this.heroData.name} says: "${userText}"]`, 'user');
  }

  // Maintain story history for AI context
  addToHistory(text, source) {
    this.history.push({ text, source, timestamp: Date.now() });
  }

  // Format history for Claude API context injection
  getFormattedHistory() {
    return this.history.map(h => h.text).join('\n\n');
  }
}
```

### File: `src/games/story-quest/engine/StreamHandler.js`

**Handles the Claude API streaming + delimiter parsing:**

```javascript
class StreamHandler {
  constructor({ heroData, worldId }) {
    this.heroData = heroData;
    this.worldId = worldId;
  }

  // Stream a story segment from Claude API
  // Returns: { text, choices, allowFreeText }
  async stream({ prompt, context, history, freeTextInput, onTextChunk }) {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt({ prompt, context, history, freeTextInput });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let delimiterFound = false;
    let textPortion = '';
    let jsonPortion = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Parse SSE events, extract text deltas
      const textDelta = this.parseSSEChunk(chunk);
      if (!textDelta) continue;

      fullText += textDelta;

      if (!delimiterFound) {
        if (fullText.includes('---CHOICES---')) {
          delimiterFound = true;
          const parts = fullText.split('---CHOICES---');
          textPortion = parts[0].trim();
          jsonPortion = parts[1] || '';
        } else {
          // Still in text portion — emit to typewriter
          onTextChunk(textDelta);
        }
      } else {
        // After delimiter — accumulate JSON silently
        jsonPortion += textDelta;
      }
    }

    // If delimiter never found, treat entire response as text
    if (!delimiterFound) {
      textPortion = fullText.trim();
      return {
        text: textPortion,
        choices: ['Continue the adventure', 'Try something different'],
        allowFreeText: true
      };
    }

    // Parse choices JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonPortion.trim());
    } catch (e) {
      // JSON parse failed — extract what we can or use defaults
      parsed = { choices: ['Continue the adventure', 'Try something new'], allowFreeText: true };
    }

    return {
      text: textPortion,
      choices: parsed.choices || ['Continue'],
      allowFreeText: parsed.allowFreeText || false
    };
  }

  buildSystemPrompt() {
    return `You are a master storyteller writing an interactive adventure for a child.

CHARACTER: ${this.heroData.name} — ${this.heroData.description}
Always refer to the hero by name. Make them the central actor in every segment.

WORLD: ${this.worldId}

RULES:
- Write 3-6 vivid, engaging sentences appropriate for a child reading at 3rd grade level
- Use rich vocabulary but keep sentence structure clear
- Be warm, exciting, and age-appropriate
- No violence beyond mild cartoon action
- No scary content, adult themes, or anything distressing
- End the segment at a moment of choice or discovery

FORMAT:
Write the story segment as plain text.
Then on a new line write exactly: ---CHOICES---
Then write a JSON object: { "choices": ["Choice 1", "Choice 2", "Choice 3"], "allowFreeText": false }
Each choice should be 1 short sentence starting with a verb.
Set allowFreeText to true roughly every 4-5 segments.`;
  }

  buildUserPrompt({ prompt, context, history, freeTextInput }) {
    let userPrompt = '';
    if (history) {
      userPrompt += `Story so far:\n${history}\n\n`;
    }
    if (freeTextInput) {
      userPrompt += `The hero decided: "${freeTextInput}"\nIncorporate this naturally into the next segment.\n\n`;
    }
    if (context) {
      userPrompt += `Scene context: ${context}\n\n`;
    }
    userPrompt += prompt;
    return userPrompt;
  }

  // Parse Server-Sent Events format from Claude streaming API
  parseSSEChunk(chunk) {
    // Extract text deltas from SSE 'data:' lines
    // Handle content_block_delta events with type 'text_delta'
    const lines = chunk.split('\n');
    let text = '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta' && data.delta?.text) {
            text += data.delta.text;
          }
        } catch (e) {
          // Not JSON or not a delta event — skip
        }
      }
    }
    return text || null;
  }
}
```

**Wrap-up handling:**
When segment count reaches 20, the engine makes one final AI call with modified prompt:
```
"This is the final segment of the story. Write a satisfying, warm conclusion 
that wraps up the adventure. The hero should feel accomplished and ready 
to come home. Do not generate choices — instead end with a closing line 
that feels like the last page of a storybook."
```

## Pass Conditions

- [ ] `playSegment()` correctly routes procedural vs ai_moment segments
- [ ] Procedural segments: hero placeholders replaced, text and choices emitted via callbacks
- [ ] AI moments: text streams via `onTextChunk`, choices emitted after delimiter parsing
- [ ] Delimiter `---CHOICES---` correctly splits text from JSON in the stream
- [ ] When delimiter is missing: full text rendered, default choices provided
- [ ] When JSON parsing fails: default choices provided, flow continues
- [ ] Fallback plays correctly when API call fails (network error, timeout)
- [ ] Free text input is incorporated into the next AI call's context
- [ ] Story history accumulates and formats correctly for API context
- [ ] `selectChoice()` correctly resolves next segment via nextMap (procedural) or branchHints (AI)
- [ ] Story wraps up at segment 20 with a conclusion segment
- [ ] System prompt includes hero name, description, world, and all safety guardrails
- [ ] SSE parsing correctly extracts text deltas from Claude streaming format
- [ ] No audio, no rendering, no UI — pure engine logic + API communication
- [ ] Complete files, no fragments
