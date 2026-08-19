---
id: 0001
title: TAMMY Wellness Gamification & AI Healthcare Platform Spec
status: ready-for-agent
tags: [spec, core, gamification, ai, backend, frontend]
created_at: 2026-08-18
---

# TAMMY Wellness Gamification & AI Healthcare Platform Specification

## Problem Statement

Modern individuals frequently struggle with irregular lifestyle habits (imbalanced diet, insufficient hydration, chronic mental stress, lack of physical activity) leading to heightened health risks. While digital health and diet tracking applications aim to mitigate these issues, over 90% of users abandon these apps within the first 30 days due to excessive data entry burden and logging fatigue.

Furthermore, traditional calorie counters generate numerical guilt and negative nudges, triggering anxiety in up to 73% of users. Without empathetic emotional support or intrinsic gamified motivation, users experience tracking burnout and abandon their wellness routines.

## Solution

TAMMY is an empathetic AI wellness companion platform that replaces tedious manual logging and numerical guilt with a gamified space exploration narrative ("Star Travel") and hybrid edge-cloud AI.

1. **Effortless Logging**: High-speed local vision AI detects food items from meal photos and maps them to standard nutritional databases without manual entry barriers, accompanied by 1-Tap quick logging for hydration, mood, and workouts.
2. **Two-Gauge Gamification**: Every wellness action charges a global Fuel gauge (+10) and shortens the Distance to one of five thematic planets (Meal, Water, Emotion, Habit, Retrospect). Reaching distance 0 with 100 Fuel unlocks a warp departure and arrival sequence.
3. **Empathetic Companion & Narrative Reports**: The virtual pixel pet "TAMMY" reacts dynamically with expressive motions based on real-time emotion state classification from text conversations. Upon reaching planets, TAMMY delivers warm, narrative-driven AI reflection reports and actionable guidance rather than sterile statistical charts.

## User Stories

1. As a busy user, I want to capture a photo of my meal and have food items detected automatically, so that I do not have to search and type calories manually.
2. As a user, I want to see visual bounding boxes around detected foods on my meal photo, so that I can verify and adjust portions easily.
3. As a user, I want to record my water intake with a single tap, so that logging hydration takes less than 3 seconds.
4. As a user, I want to log my current mood or write a brief journal entry, so that I can track my emotional well-being effortlessly.
5. As a user, I want to receive +10 Fuel whenever I log a wellness activity, so that my everyday healthy choices feel instantly rewarding.
6. As a user, I want to see my spaceship progress along the star route on the home screen, so that I have a clear sense of progression toward the next planet.
7. As a user, I want to track remaining distances for each of the 5 planets (Meal, Water, Emotion, Habit, Retrospect), so that I know which wellness area I am advancing.
8. As a user, I want to trigger a warp departure when my Fuel reaches 100 and an active planet's distance reaches 0, so that I experience an exciting visual reward for my consistency.
9. As a user, I want the system to safely record new wellness logs during warp animations without resetting my fuel or losing progress, so that my actions are never discarded.
10. As a user, I want to view a personalized AI reflection report upon arriving at a planet, so that I receive meaningful narrative feedback rather than cold numbers.
11. As a user, I want to chat with TAMMY via text messaging, so that I can share my daily worries and receive judgment-free empathy.
12. As a user, I want TAMMY to show animated sprite reactions (e.g., hugging, cheering, nodding) that match the emotional tone of my chat, so that the interaction feels alive.
13. As a user, I want to receive tailored home workout recommendations based on my fitness profile and available time, so that I can exercise effectively at home.
14. As a user, I want my TAMMY companion to gain experience and level up as I maintain my wellness habits, so that I build a lasting bond with my pet.
15. As a user on an unstable mobile network, I want my logs to be idempotent via unique request identifiers, so that retransmissions never duplicate rewards or distort my travel gauges.

## Implementation Decisions

### Architectural & Module Boundaries
- **3-Tier Microservices Topology**:
  - **Client Application**: SPA providing responsive 1-Tap UI, Framer Motion physics-based star animations, and pixel-art companion rendering.
  - **Core Service Backend**: Node.js/TypeScript REST API server orchestrating auth, gamification rules, database transactions, local ONNX inference, and background asynchronous jobs.
  - **AI Microservice**: Go/Genkit stateless container service deployed on GCP Cloud Run, handling multimodal vision fallback, prompt-engineered emotional analysis, and 5-domain narrative report generation.

### Domain Modeling & Two-Gauge System
- **Global Fuel**: Clamped integer range (0 to 100). Every wellness activity increments Fuel by +10. Warp departure deducts 100 Fuel.
- **Planet Distance**: Independent distance per planet (100 to 0). Meal/Habit activities decrement distance by -10; Water/Emotion activities decrement by -5. Distance 0 flags the planet as ready for departure.
- **Planet Lifecycle**: Strict state machine transitions (`READY` -> `TRAVELING` -> `ARRIVED`). `ARRIVED` resets planet distance to 100 and enqueues asynchronous AI report generation.
- **Idempotency & Auditing**: All gauge-affecting endpoints accept an optional/required unique `clientRequestId`. Audit logs (`fuel_logs`) guarantee that repeated requests return the same response without duplicate state mutations.

### Hybrid AI Vision & Fallback Pipeline
- **Tier 1 (Local Edge Inference)**: On-premise ONNX Runtime with YOLOv8 food weights embedded in the backend server. Preprocessed images yield bounding boxes and top food classes mapped to 15,000 standard food database entries at sub-500ms latency.
- **Tier 2 (Cloud LLM Inference)**: Complex multi-dish photos or low-confidence detections fallback to Gemini multimodal vision via the Go AI server.
- **Structured LLM Output**: All Genkit prompts declare strict JSON schemas in dotprompt frontmatter with low temperature (0.3 to 0.7) to eliminate hallucinated response formats.

### Security, Performance & Logging
- **Authentication**: Stateless Bearer JWT tokens with TSOA security guards.
- **Rate Limiting**: 100 requests per 15 minutes per IP on critical public endpoints.
- **Distributed Tracing**: `X-Correlation-Id` propagation across HTTP headers and Winston structured logging with PII masking.
- **Asynchronous Execution**: In-process EventEmitter job queue for long-running report generation with SSE (Server-Sent Events) notification to clients.

## Testing Decisions

### Good Test Criteria
- Tests must exclusively target observable system behavior at public API contracts and domain boundaries, avoiding assertions on private implementation details or internal ORM queries.
- Mock external network dependencies (such as Cloud Run AI endpoints and third-party APIs) using dedicated test doubles to guarantee deterministic and rapid test execution.

### Test Seams & Coverage
- **Seam 1: HTTP / Controller Seam (Highest Backend Seam)**
  - Supertest + Jest integration tests asserting complete request/response cycles for authentication, quick-logging, star-travel state transitions, and food confirmation.
- **Seam 2: Domain Gamification Engine Seam**
  - Unit tests verifying the Two-Gauge arithmetic, boundary clamping (0-100), idempotent request replay, and planet lifecycle state transitions.
- **Seam 3: AI Service Fallback Seam**
  - Contract and fallback tests verifying that when Tier 1 vision or Tier 2 cloud services encounter timeouts, the system gracefully reverts to fallback standard database search without unhandled 500 errors.
- **Seam 4: Frontend API Client Seam**
  - Client-side mock adapter verifying that UI components render correct fuel increments, animation triggers, and error toasts across all backend DTO responses.

## Out of Scope

- Speech-to-Text (STT) and Text-to-Speech (TTS) audio processing (pure text and sprite motion interaction only).
- Hardware wearable Bluetooth/BLE direct synchronization (manual quick-log and AI estimation only).
- Multiplayer social guild/party systems (individual companion experience).
- Direct payment gateway and commercial monetization features.

## Further Notes

- All domain terminology aligns directly with `CONTEXT.md` in `NASA_backEnd-main`.
- Academic citations and empirical data supporting problem definition metrics are cataloged in `docs/references/RESEARCH_METRICS_CITATIONS.md` and referenced in `PLANNING_REPORT.md`.
