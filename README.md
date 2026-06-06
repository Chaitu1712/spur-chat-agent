# Spur AI Support Agent – Founding Full-Stack Engineer Take-Home

A modern, glassmorphism-inspired AI live chat support agent. Built to demonstrate a robust full-stack architecture, secure LLM integration, and a premium user experience.

**🚀 Live Demo:** [https://spur-chat-agent-chi.vercel.app]

**🛠️ Tech Stack:** Svelte 5, SvelteKit, TypeScript, Prisma, Vercel Postgres (Neon), Google Gemini 2.5 Flash.

---

## 🏃‍♂️ How to Run Locally

### 1. Prerequisites
- Node.js (v18+)
- A Google AI Studio API Key (Gemini)
- A PostgreSQL database (Vercel Postgres or local)

### 2. Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd spur-chat-agent

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
# Database (Vercel Postgres / Neon)
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# AI Provider
GEMINI_API_KEY="your_gemini_api_key"
```

### 4. Database Initialization
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to your database
npx prisma db push
```

### 5. Start Development
```bash
npm run dev
```
The app will be running at `http://localhost:5173`.

---

## 🏗️ Architecture Overview

The project is built using **SvelteKit** as a unified full-stack framework, following a clear separation of concerns:

### Frontend (UI Layer)
- **Framework:** Svelte 5 using **Runes** (`$state`, `$effect`) for high-performance reactivity.
- **Styling:** Tailwind CSS with a custom Glassmorphism theme to provide a premium "SaaS" feel.
- **State Management:** URL-driven state. The `sessionId` is persisted in the URL query parameters, allowing users to share or bookmark conversations.
- **Security:** Markdown responses from the AI are sanitized using `DOMPurify` to prevent XSS attacks.

### Backend (API & Logic Layer)
- **Endpoints:** Located in `src/routes/api/`, handling message persistence and LLM orchestration.
- **Services:**
    - `prisma.ts`: A singleton database client optimized for serverless environments.
    - `llm.ts`: Encapsulated logic for Google Gemini, managing system prompts and conversation history.
- **ORM:** Prisma is used for type-safe database queries and easy schema evolution.

---

## 🤖 LLM Implementation & Guardrails

### Provider
I chose **Google Gemini 1.5 Flash** for its exceptional speed and generous rate limits, which are ideal for a responsive customer support experience.

### Prompting Strategy
The agent is initialized with a **System Instruction** that defines its persona (SpurMart Support) and its knowledge base (Shipping/Returns). 
- **Contextual History:** The backend fetches the last 10 messages from the database to ensure the AI maintains state (e.g., remembering the user's name or order issue).
- **Format:** The AI is instructed to use Markdown for structured data like lists and bold text.

### Robustness & Security (Idiot-Proofing)
- **Input Validation:** Messages are trimmed, checked for empty strings, and truncated at 1,000 characters to prevent token-stuffing attacks.
- **Prompt Injection Defense:** User input is wrapped in XML-style tags (`<user_query>`) to help the LLM distinguish between data and instructions.
- **Graceful Failure:** If the API key is invalid or the LLM times out, the backend returns a 503 error, and the UI displays a friendly "Technical Difficulties" bubble instead of crashing.

---

## 💾 Data Model

The schema is designed for scalability:
- **Session:** Tracks unique conversations and timestamps.
- **Message:** Stores the relationship between sessions, roles (`user` vs `ai`), and content. We use `TEXT` fields in Postgres to support long-form AI responses.

---

## ⚖️ Trade-offs & "If I had more time..."

### Trade-offs
1. **SSR Disabled:** I disabled Server-Side Rendering (`ssr = false`) to prioritize client-side stability with the `DOMPurify` and `jsdom` dependency chain. In a real product, I would move sanitization to the backend or use a node-native sanitizer.
2. **Simple Auth:** For this exercise, "Auth" is handled via `localStorage` and `sessionId` tracking. In a production Spur environment, this would be tied to a Shopify customer ID or WhatsApp phone number.

### If I had more time...
1. **Streaming Responses:** I would implement Server-Sent Events (SSE) to stream the AI response word-by-word, which significantly improves perceived performance.
2. **RAG (Retrieval Augmented Generation):** Instead of hardcoding the FAQ in the prompt, I would implement a vector search (using pgvector) to allow the store owner to upload large PDF manuals.
3. **Tool Use:** I would give the AI the ability to "Check Order Status" by connecting it to a mock Shopify API.
4. **Unit Testing:** Add Vitest suites for the LLM service to ensure guardrails aren't broken by prompt updates.
