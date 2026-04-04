const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a strict code reviewer. Analyze the given git diff and respond ONLY with valid JSON in this format:
{
  "summary": "Brief overall summary of changes",
  "issues": [
    {
      "file": "filename",
      "line": "line number or range",
      "severity": "critical | warning | suggestion",
      "message": "What's wrong and how to fix it"
    }
  ],
  "approved": true/false
}
Rules:
- Flag bugs, security issues, performance problems, and bad practices
- Be specific about line numbers from the diff
- Set approved to false if any critical issues exist
- Keep messages concise and actionable`;

async function analyzeDiff(diffText) {
  const token = process.env.OPENAI_API_KEY;
  if (!token) {
    console.error("Error: OPENAI_API_KEY environment variable is not set.");
    return null;
  }

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: diffText },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`OpenAI API error ${res.status}: ${body}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Error: Empty response from OpenAI.");
      return null;
    }

    // Strip markdown code fences if the model wraps its response
    const cleaned = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`analyzeDiff failed: ${err.message}`);
    return null;
  }
}

export { analyzeDiff };
