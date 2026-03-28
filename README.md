# 🚀 OutSourceAI Frontend

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

OutSourceAI is an **Agentic AI Orchestration Platform** designed to automate end-to-end business operations, marketing strategy, and content delivery. By deploying a team of specialized AI agents, OutSourceAI handles everything from company onboarding to high-fidelity creative asset generation.

---

## 🌐 Project Overview: What is OutSourceAI?

OutSourceAI isn't just a dashboard; it's a **virtual workforce management system**. Traditional outsourcing is slow and expensive; OutSourceAI provides a scalable, 24/7 alternative using **Large Language Models (LLMs)** and **Autonomous Agents**.

### The Agentic Workforce:

- **🕵️ Strategist**: Analyzes industry trends and competitive landscapes.
- **📅 Planner**: Crafts long-term content calendars and tactical roadmaps.
- **✍️ Content Generator**: Produces high-quality, brand-consistent copy for LinkedIn, X (Twitter), and Blogs.
- **🎨 Designer**: Generates visual briefs and integrates with Figma/Canvas for creative assets.
- **🛡️ Compliance & Analyst**: Ensures brand safety and tracks performance metrics.
- **👔 Manager**: Orchestrates the entire team, handling feedback loops and task delegation.

---

## 💻 Frontend Features

The OutSourceAI Frontend provides a **High-Performance Dashboard** ensuring zero overhead and maximum responsiveness.

### Key Modules:

- **📊 Overview Dashboard**: Visualizes your agentic workforce's health, total campaigns, and generated content throughput.
- **🏢 Enterprise Onboarding**: A streamlined workflow to ingest company data, brand voice, and social handles.
- **🗓️ Campaign Management**: An interactive content calendar where users can preview generated social posts, request revisions from agents, or approve them for scheduling.
- **⚡ Real-time Pipeline Logs**: Powered by **Supabase Realtime**, this module provides a live feed of agent "thoughts," status changes, and task completions.
- **📝 Task Assignment**: Allows manual intervention by assigning specific prompts or targets to individual agents.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/outsource-ai.git
   cd outsource-ai-frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_BACKEND_URL=http://localhost:8000
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
