---
name: emotional-design-norman
description: Apply Norman-style emotional design to web generation and polish by balancing visceral appeal, behavioral usability, and reflective meaning.
---

# Emotional Design Norman Adapter

This project adapts Don Norman's three-level emotional design model for Design Works generation.
Use it when a generated web screen needs to feel more memorable, trustworthy, warm, premium, lively, calm, or meaningful without weakening usability.

## Workflow

1. Frame the emotional target
   - Identify the user, use context, service category, risk level, and desired feeling.
   - If the brief is thin, infer a conservative emotional goal from the product category.

2. Map the design to three levels
   - Visceral: first impression, sensory tone, color temperature, imagery, type scale, rhythm.
   - Behavioral: clarity, effort, control, feedback, readable hierarchy, reliable interaction.
   - Reflective: identity, trust, pride, social meaning, long-term memory, brand story.

3. Design interventions
   - Add or refine cues that serve at least one level.
   - Prefer changes that reinforce multiple levels.
   - Do not trade task success, accessibility, or content clarity for surface emotion.

4. Validate
   - Visceral: does the screen have a recognizable mood in 3 seconds?
   - Behavioral: can the primary task be understood and started without explanation?
   - Reflective: does the screen communicate why the service matters?

## Design Works Output Contract

Generated JSON should include an `emotionalDesign` object inside `designStrategy`:

```json
{
  "emotionalDesign": {
    "targetEmotion": "신뢰와 기대감",
    "visceral": "첫인상 감각 단서",
    "behavioral": "사용 중 편안함과 통제감",
    "reflective": "사용 후 남는 의미와 브랜드 기억",
    "tradeoffs": ["감성보다 명확성을 우선한 지점"]
  }
}
```

The HTML must visibly reflect the emotional strategy through composition, copy, hierarchy, imagery, surface treatment, and interaction states.
