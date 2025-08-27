# Personal Todo V3

A modern, full-stack task management application built with Next.js 15, TypeScript, and PostgreSQL. Features real-time updates, drag-and-drop functionality, and comprehensive project management capabilities.

## Features

### Core Functionality
- **Task Management**: Create, update, delete, and organize tasks with priorities
- **Project Organization**: Group tasks into projects with custom colors and descriptions
- **Kanban Board**: Drag-and-drop interface with TODO, IN_PROGRESS, and DONE columns
- **Priority System**: High, Medium, and Low priority levels with visual indicators
- **Due Dates**: Set and track task deadlines with calendar integration
- **Comments**: Collaborate with threaded comments on tasks
- **File Attachments**: Upload and manage files associated with tasks

### User Experience
- **Real-time Updates**: Server-sent events for live collaboration
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Mode**: Theme switching with system preference detection
- **Intuitive UI**: Clean, modern interface built with shadcn/ui components
- **Fast Performance**: Optimized for speed with Next.js 15 and modern React patterns

### Security & Authentication
- **Secure Authentication**: NextAuth.js with credential-based login
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Session Management**: Secure session handling and automatic logout
- **Data Protection**: SQL injection prevention with Prisma ORM

### Integrations
- **Telegram Notifications**: Real-time task notifications via Telegram bot
  - Task creation alerts with full details and attachments
  - Task update notifications with change tracking
  - Overdue task reminders at configurable intervals
  - Smart message editing (updates existing messages when possible)
  - Attachment change detection (recreates messages when attachments change)

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI component library
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **Framer Motion** - Smooth animations

### Backend
- **PostgreSQL** - Production database (Supabase)
- **Prisma** - Type-safe database ORM
- **NextAuth.js** - Authentication framework
- **bcryptjs** - Password hashing
- **Server-Sent Events** - Real-time updates

### Tools & Utilities
- **DND Kit** - Drag and drop functionality
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **node-telegram-bot-api** - Telegram bot integration
- **node-cron** - Task reminder scheduling
- **Date-fns** - Date manipulation
- **Lucide React** - Icon library

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Supabase account recommended)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dananjayahbi/personal_todo_v3.git
   cd personal_todo_v3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/database"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secure-secret
   EMAIL_HOST_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   ```

4. **Database Setup**
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` and login with:
- Email: `dananjayahbi@gmail.com`
- Password: `password`

### Telegram Integration Setup (Optional)

To enable Telegram notifications for tasks:

1. **Quick Setup (Recommended)**
   ```bash
   node telegram-config.js
   ```
   This interactive script will guide you through the entire setup process.

2. **Manual Setup**
   - Create a bot via @BotFather on Telegram
   - Get your chat ID
   - Add to `.env`:
     ```env
     TELEGRAM_BOT_TOKEN=your_bot_token_here
     TELEGRAM_CHAT_ID=your_chat_id_here
     ```
   - See `TELEGRAM_SETUP.md` for detailed instructions

3. **Test Integration**
   ```bash
   node test_telegram.js
   ```
   This tool lets you test different message types and verify your setup.

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import project to Vercel
   - Connect to GitHub repository

2. **Environment Variables**
   Add these to your Vercel project:
   ```
   DATABASE_URL=your-supabase-connection-string
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-production-secret
   EMAIL_HOST_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   ```

3. **Database Migration**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Other Platforms
The application is compatible with any Node.js hosting platform:
- Railway
- Render
- DigitalOcean App Platform
- AWS
- Google Cloud Platform

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   ├── tasks/             # Task management
│   ├── projects/          # Project management
│   └── settings/          # User settings
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── task-card.tsx     # Task display component
│   └── sidebar.tsx       # Navigation sidebar
├── lib/                   # Utility functions
│   ├── db.ts             # Database connection
│   ├── password.ts       # Password utilities
│   └── utils.ts          # Helper functions
└── hooks/                 # Custom React hooks

prisma/
├── schema.prisma          # Database schema
├── migrations/            # Database migrations
└── seed.ts               # Initial data seeding
```

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `POST /api/auth/change-password` - Password change
- `POST /api/auth/reset-password` - Password reset

### Tasks
- `GET /api/tasks` - List user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/batch-update` - Update multiple tasks

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Real-time
- `GET /api/realtime` - Server-sent events stream
- `POST /api/realtime` - Broadcast real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

**Developer**: Isuru Dananjaya  
**Email**: dananjayahbi@gmail.com  
**GitHub**: [@dananjayahbi](https://github.com/dananjayahbi)

---

Built with modern web technologies for efficient task management and team collaboration.
