# Quickstart Guide: Physical AI & Humanoid Robotics Book

## Overview
This guide provides a quick setup and development workflow for the Physical AI & Humanoid Robotics educational book project.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Access to official ROS 2, Gazebo, NVIDIA Isaac, and Unity documentation

## Setup Instructions

### 1. Clone and Initialize
```bash
git clone [repository-url]
cd [repository-name]
npm install
```

### 2. Local Development Server
```bash
npm start
```
This command starts a local development server at http://localhost:3000 with hot reloading.

### 3. Project Structure
```
Physical-AI-And-Humanoid-Robotics/
├── docs/                   # Main documentation content
│   ├── intro/             # Introduction module
│   ├── module-1-ros2/     # ROS 2 fundamentals
│   ├── module-2-digital-twin/ # Simulation with Gazebo & Unity
│   ├── module-3-ai-robot-brain/ # NVIDIA Isaac
│   ├── module-4-vla/      # Vision-Language-Action
│   ├── capstone-project/  # Capstone project module
│   ├── hardware-appendix/ # Hardware recommendations
│   └── cloud-onprem-guide/ # Cloud vs on-premise guide
├── src/                   # Custom React components
├── static/               # Static assets
├── docusaurus.config.js   # Docusaurus configuration
├── sidebars.js           # Navigation sidebar configuration
└── package.json          # Project dependencies
```

## Content Creation Workflow

### 1. Create a New Module Page
```bash
# Create a new MDX file in the appropriate module directory
touch docs/module-1-ros2/new-topic.mdx
```

### 2. Content Format
```mdx
---
title: Your Page Title
description: Brief description of the page content
sidebar_position: 1  // Controls position in sidebar
---

# Your Page Title

Content goes here...

## Section Header

More content with [links](./relative-path) and `code`.

import Component from '@site/src/components/Component';

<Component />

```code block
// Code examples with syntax highlighting
```

:::note
Special notes, warnings, or tips can be added with admonitions.
:::

```

### 3. Running Validation
```bash
# Build the site to validate all links and content
npm run build

# Run the development server to preview changes
npm start
```

## Documentation Standards

### Technical Accuracy
- All code examples must be validated against official documentation
- Use MCP Server 7 to fetch accurate API references
- No hallucination of APIs or features

### Writing Quality
- Grade level 8-12 appropriate content
- Clear step-by-step explanations
- Professional, friendly, educational tone
- Proper Markdown + MDX formatting

### Visual Consistency
- Use light/dark mode compatible components
- Consistent heading hierarchy (##, ###, etc.)
- Properly formatted code blocks with language specification
- Include diagrams and visuals when needed

## Deployment

### GitHub Pages
The site is automatically deployed via GitHub Actions when changes are pushed to the main or 001-vla-systems branch.

### Manual Deployment
```bash
# Build and deploy to GitHub Pages
npm run deploy
```

## Research and Validation

### Fetching Official Documentation
When creating content, always verify against official sources:
- ROS 2 Humble/Iron documentation
- Gazebo Garden/Fortress documentation
- NVIDIA Isaac Sim & Isaac ROS documentation
- Unity HDRP robotics workflows
- OpenAI Whisper documentation
- VLA robotics papers

### Validation Checklist
- [ ] Docusaurus builds without errors
- [ ] GitHub Pages deploys properly
- [ ] Sidebar/nav structure renders correctly
- [ ] MDX formatting validated
- [ ] All modules complete
- [ ] Examples runnable in ROS 2 and Isaac Sim
- [ ] Hardware specs accurate to vendors
- [ ] VLA workflow executable end-to-end
- [ ] UI responsive
- [ ] Light/dark toggle working
- [ ] GitHub link functional