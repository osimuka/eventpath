# Web UI

Next.js/React dashboard for analytics visualization and workflow management.

## Features

- 📊 Real-time analytics dashboard
- 🔄 Workflow management interface
- 💡 AI insights visualization
- 📈 Funnel analysis charts
- 🎨 Responsive Tailwind UI

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view in browser.

### Build

```bash
npm run build
npm start
```

## Pages

- `/` - Dashboard overview
- `/workflows` - Workflow management
- `/insights` - AI-powered insights

## Components

- `FunnelChart` - Visualization for funnel metrics
- `EventTable` - Event log display

## Building Docker Image

```bash
docker build -t analytics-web:latest .
```
