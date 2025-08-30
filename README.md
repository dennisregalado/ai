<div align="center">

<img src="public/icon.svg" alt="Sparka AI" width="64" height="64">

# Sparka AI

**AI for everyone, from everyone**

*Multi-provider AI Chat - access Claude, ChatGPT, Gemini, and Grok with advanced features, open-source and production-ready.*

[**Try Sparka AI**](https://sparka.ai)


</div>

![sparka_gif_demo](https://github.com/user-attachments/assets/34a03eed-58fa-4b1e-b453-384351b1c08c)

Access every major AI assistant Claude, GPT-4, Gemini, Grok, and 20+ models through one interface. Get capabilities like document analysis, image generation, code execution, and research tools without managing multiple subscriptions. Try instantly, no signup required.


## ✨ Features

- **🤖 Multi-Model Chat** - Access 100+ AI models including Claude, GPT-5, Gemini, and Grok in one interface.

- **🔐 Authentication & Sync** - Secure authentication with chat history sync across all devices.

- **🎯 Easy to Try** - Try the interface and some features without creating an account.

- **📎 Attachment Support** - Upload and analyze images, PDFs, and documents in conversations.

- **🎨 AI-Powered Image Generation** - Generate and edit images with advanced AI models.

- **💻 Syntax Highlighting** - Beautiful code formatting and highlighting for all programming languages.

- **🔄 Resumable Streams** - Continue AI generations after page refreshes or interruptions.

- **🌳 Chat Branching** - Create alternative conversation paths without losing your original thread.

- **🔗 Chat Sharing** - Share conversations with others and collaborate on AI-assisted projects.

- **🔭 Deep Research** - Comprehensive research with real-time web search, source analysis, and cited findings.

- **⚡ Code Execution** - Run Python, JavaScript, and more in secure sandboxes.

- **📄 Document Creation** - Generate and edit documents, spreadsheets, and presentations.


## 🛠️ Tech Stack

Sparka AI is built with modern technologies for scalability and performance:

### **Frontend**
- **Next.js 15**: App Router with React Server Components
- **TypeScript**: Full type safety and developer experience
- **Tailwind CSS**: Responsive, utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions
- **Zustand**: Lightweight state management

### **Backend**
- **Vercel AI SDK**: Unified AI provider integration
- **tRPC**: End-to-end typesafe APIs
- **Supabase**: Authentication and PostgreSQL database
- **PostgreSQL**: Robust data persistence via Supabase
- **Redis**: Caching and real-time features

### **AI Integration**
- **AI SDK v5**: Latest Vercel AI SDK for unified provider integration
- **AI SDK Gateway**: Models from various AI providers with automatic fallbacks


## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ or Bun
- Supabase account and project
- Redis (optional, for scaling)

### **Quick Start**

1. **Clone and Install**
   ```bash
   git clone https://github.com/franciscomoretti/sparka.git
   cd sparka
   bun install
   ```

2. **Supabase Setup**
   
   Create a new Supabase project at [supabase.com](https://supabase.com):
   
   - Go to your project settings → API
   - Copy your project URL and anon key
   - Go to Authentication → Providers and enable Google/GitHub OAuth
   - Configure OAuth redirect URLs: `http://localhost:3000/auth/callback` (development)

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update your `.env.local` with your Supabase credentials:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # OAuth Providers (configure in Supabase Auth settings)
   AUTH_GOOGLE_ID=your_google_client_id
   AUTH_GOOGLE_SECRET=your_google_client_secret
   AUTH_GITHUB_ID=your_github_client_id
   AUTH_GITHUB_SECRET=your_github_client_secret
   
   # Add your AI provider keys and other services...
   ```

4. **Database Setup**
   
   Run the migration to set up your database schema:
   ```bash
   # Using local Supabase (recommended for development)
   npx supabase start
   npx supabase db push
   
   # OR connect to your hosted Supabase project
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

5. **Development Server**
   ```bash
   bun dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to start using Sparka AI locally.

## 🔄 Migration from Original Sparka

This fork has been refactored to use **Supabase** instead of the original **Prisma + PlanetScale + NextAuth** stack:

### **What Changed:**
- ✅ **Authentication**: NextAuth.js → Supabase Auth (Google & GitHub OAuth)
- ✅ **Database**: Prisma + PlanetScale → Supabase PostgreSQL with Row Level Security
- ✅ **API Layer**: tRPC maintained (now uses Supabase client in procedures)
- ✅ **Schema**: Converted from Prisma schema to Supabase migrations
- ✅ **Session Management**: NextAuth sessions → Supabase auth state

### **What Stayed the Same:**
- ✅ **tRPC**: All your existing tRPC procedures work the same way
- ✅ **UI/UX**: No changes to the user interface
- ✅ **AI Features**: All AI capabilities remain unchanged
- ✅ **Type Safety**: Full TypeScript support maintained

### **Benefits of Supabase:**
- 🚀 **Simpler Setup**: No need for separate auth and database services
- 🔒 **Built-in Security**: Row Level Security policies out of the box
- 📊 **Real-time**: Built-in real-time subscriptions (future feature)
- 🛠️ **Developer Experience**: Supabase Studio for database management
- 💰 **Cost Effective**: Generous free tier with auth + database included

## 🙏 Acknowledgements

Sparka AI was built on the shoulders of giants. We're deeply grateful to these outstanding open source projects:

- **[Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)** - Core architecture and AI SDK integration patterns
- **[Scira](https://github.com/zaidmukaddam/scira)** - AI-powered search engine

