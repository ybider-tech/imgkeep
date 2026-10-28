// What the translation scripts spend on Claude: one place for the model, its settings and its prices, and a
// tally of the tokens the API reports for each answer (thinking included), so every run prints its real cost.
// Prices: https://platform.claude.com/docs/en/about-claude/pricing (US dollars per million tokens).

// Sonnet 5 with low effort: translating short product texts doesn't need a larger model or long thinking.
export const MODEL = "claude-sonnet-5";
export const EFFORT = "low";
const PRICE = { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 };

export function tally() {
  const t = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, batch: 0 };
  return {
    // usage: the API's message.usage. Batch requests cost half.
    add(usage, { batch = false } = {}) {
      const k = batch ? 0.5 : 1;
      t.input += (usage.input_tokens || 0) * k;
      t.output += (usage.output_tokens || 0) * k; // includes thinking
      t.cacheWrite += (usage.cache_creation_input_tokens || 0) * k;
      t.cacheRead += (usage.cache_read_input_tokens || 0) * k;
    },
    dollars: () => (t.input * PRICE.input + t.output * PRICE.output + t.cacheWrite * PRICE.cacheWrite + t.cacheRead * PRICE.cacheRead) / 1e6,
    summary() {
      return `Spent about $${this.dollars().toFixed(2)} (${Math.round(t.input + t.cacheWrite + t.cacheRead).toLocaleString()} tokens in, ${Math.round(t.output).toLocaleString()} out, thinking included).`;
    },
  };
}

// A rough upper estimate before a run: text tokens, translations ~1.5× longer, plus thinking at low effort
// (assumed as much again as the answer). Run with --sample first for a measured number.
export function estimate(chars, requests, { batch = false } = {}) {
  const textIn = chars / 3.5 + requests * 2500;
  const out = (chars / 3.5) * 1.5 * 2;
  const dollars = ((textIn * PRICE.input + out * PRICE.output) / 1e6) * (batch ? 0.5 : 1);
  return `Estimate with ${MODEL} (effort ${EFFORT}): up to about $${dollars.toFixed(2)}${batch ? " in batch mode" : ` ($${(dollars / 2).toFixed(2)} with --batch)`}. --sample measures it first.`;
}
