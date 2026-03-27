/**
 * StreamHandler.js — Claude API streaming with delimiter parsing.
 * Streams story text, detects ---CHOICES--- delimiter, parses JSON choices.
 */

const API_URL = '/api/claude'; // Proxied through Vercel Edge function
const DEFAULT_CHOICES = ['Continue the adventure', 'Try something different'];

export default class StreamHandler {
  constructor({ heroData, worldId }) {
    this.heroData = heroData;
    this.worldId = worldId;
  }

  async stream({ prompt, context, history, freeTextInput, isWrapUp, onTextChunk }) {
    const systemPrompt = isWrapUp ? this.buildWrapUpSystemPrompt() : this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt({ prompt, context, history, freeTextInput, isWrapUp });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let delimiterFound = false;
    let textPortion = '';
    let jsonPortion = '';
    let preDelimiterEmitted = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const textDelta = this.parseSSEChunk(chunk);
      if (!textDelta) continue;

      fullText += textDelta;

      if (!delimiterFound) {
        if (fullText.includes('---CHOICES---')) {
          delimiterFound = true;
          const parts = fullText.split('---CHOICES---');
          textPortion = parts[0].trim();
          jsonPortion = parts.slice(1).join('');

          // Emit any text we haven't emitted yet (before delimiter)
          const unemitted = textPortion.slice(preDelimiterEmitted.length);
          if (unemitted && onTextChunk) onTextChunk(unemitted);
        } else {
          // Still in text portion — emit to typewriter
          if (onTextChunk) onTextChunk(textDelta);
          preDelimiterEmitted += textDelta;
        }
      } else {
        // After delimiter — accumulate JSON silently
        jsonPortion += textDelta;
      }
    }

    // Wrap-up: no choices expected
    if (isWrapUp) {
      if (!delimiterFound) textPortion = fullText.trim();
      return { text: textPortion, choices: null, allowFreeText: false, isEnding: true };
    }

    // If delimiter never found, treat entire response as text
    if (!delimiterFound) {
      textPortion = fullText.trim();
      return {
        text: textPortion,
        choices: DEFAULT_CHOICES,
        allowFreeText: true,
      };
    }

    // Parse choices JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonPortion.trim());
    } catch (e) {
      parsed = { choices: DEFAULT_CHOICES, allowFreeText: true };
    }

    return {
      text: textPortion,
      choices: parsed.choices || DEFAULT_CHOICES,
      allowFreeText: !!parsed.allowFreeText,
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

  buildWrapUpSystemPrompt() {
    return `You are a master storyteller writing the final segment of a child's adventure.

CHARACTER: ${this.heroData.name} — ${this.heroData.description}
Always refer to the hero by name.

RULES:
- Write a satisfying, warm conclusion (4-6 sentences)
- The hero should feel accomplished and ready to come home
- Be age-appropriate and heartwarming
- Do NOT generate choices
- End with a closing line that feels like the last page of a storybook
- Do NOT include ---CHOICES--- or any JSON`;
  }

  buildUserPrompt({ prompt, context, history, freeTextInput, isWrapUp }) {
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
    if (isWrapUp) {
      userPrompt += 'This is the final segment of the story. Write a satisfying, warm conclusion that wraps up the adventure.';
    } else {
      userPrompt += prompt || 'Continue the story.';
    }
    return userPrompt;
  }

  parseSSEChunk(chunk) {
    const lines = chunk.split('\n');
    let text = '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const data = JSON.parse(payload);
          if (data.type === 'content_block_delta' && data.delta?.text) {
            text += data.delta.text;
          }
        } catch (e) {
          // Not JSON — skip
        }
      }
    }
    return text || null;
  }
}
