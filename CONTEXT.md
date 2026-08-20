# TAMMY Star Travel & Wellness Companion Context

A gamified digital healthcare domain that transforms everyday health logging into an empathetic space exploration narrative with a virtual companion.

## Language

### Star Travel & Gamification

**Fuel**:
The global universal energy gauge (0 to 100) charged by performing any healthy daily action, consumed fully to initiate a warp travel sequence.
_Avoid_: Points, mana, stamina, battery, exp

**Distance**:
The independent remaining distance (100 to 0) required to reach a specific thematic planet through domain-specific wellness actions.
_Avoid_: Progress percentage, remaining steps, journey length

**Distance Reduction**:
The graduated unit deduction (5 or 10) applied to a specific target planet's distance upon logging a corresponding wellness action.
_Avoid_: Distance discount, step deduction, distance penalty

**Planet**:
A celestial destination representing a core wellness discipline (Meal, Water, Emotion, Habit, Retrospect) that unlocks an AI reflection report upon arrival.
_Avoid_: Stage, level, chapter, category

**Travel State**:
The discrete lifecycle phase of an exploration journey (`READY`, `TRAVELING`, `ARRIVED`).
_Avoid_: Exploration status, journey phase, trip progress

### Virtual Pet & Interaction

**Tammy**:
An empathetic virtual pixel companion that grows alongside the user's healthy lifestyle and provides emotional support without judgment.
_Avoid_: Chatbot, bot, avatar, assistant, virtual trainer

**Emotion State**:
The canonical classification of a user's psychological feeling (`HAPPY`, `SAD`, `ANGRY`, `STRESSED`, `CALM`) inferred from conversation and journaling.
_Avoid_: Mood score, sentiment rating, emotional index

**Motion Tag**:
The expressive animated sprite reaction performed by Tammy in response to user emotions and milestone achievements.
_Avoid_: Animation state, gesture, emote

**Memory Capsule**:
A structured personal context snippet extracted from conversations that preserves long-term user lifestyle habits, preferences, and pet peeves.
_Avoid_: User profile data, chat cookie, long-term memory blob

**Proactive Trigger**:
A scheduled background event detecting the absence of critical daily wellness actions (e.g. no water logged by 23:30) to prime Tammy for gentle, unprompted check-ins.
_Avoid_: Push alarm, reminder notification, penalty trigger

### Wellness Logging & Reporting

**Food Scan**:
The visual capture and automatic detection of meal items mapped to nutritional components.
_Avoid_: Calorie entry, diet logging, meal OCR

**Food Tokenizer**:
The rule-based linguistic preprocessor separating modifier prefixes (e.g., 매운, 치즈, 수제) and quantity units (e.g., 2인분, 200g) to extract normalized core food nouns.
_Avoid_: NLP parser, food lemmatizer, word stemmer

**Food Mapping**:
The caching and association layer (`EXACT`, `ALIAS`, `SIMILARITY`) resolving user raw food inputs to authoritative standard nutrition entries.
_Avoid_: Food dictionary, diet lookup table, calorie tag

**Master Protection Principle**:
The architectural invariant dictating that the 15,000 national standard food records in `foods` remain strictly immutable, isolating user-defined variants and alias links to `food_mappings`.
_Avoid_: Auto-insert food, dynamic food schema, master override

**Quick-Log**:
A frictionless single-action entry for recording discrete wellness events like water intake, mood, short journal, or exercise duration.
_Avoid_: Daily check-in, micro-logging, stamp

**Planet Report**:
A warm, narrative-driven AI reflection document received upon arriving at a planet, synthesizing recent behavioral trends into supportive feedback.
_Avoid_: Statistics summary, dashboard report, analysis sheet
