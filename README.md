# Welcome to your the project

## Project info

**URL**: https://ai-assist-planner.vercel.app/

# Inspiration
As hackathon organizers ourselves, we know firsthand how overwhelming and chaotic planning can get. Finding sponsors, booking venues, managing transportation, designing websites, ordering swag, handling outreach, and running logistics, all while keeping everything on schedule, requires hundreds of emails, calls, and spreadsheet updates. Inspired by the theme of this hackathon, we asked: Why not build an AI system that can do most of this for us? That’s how Plannr was born: an intelligent AI-powered assistant that automates the hardest parts of organizing hackathons.

# What it does
Plannr is an AI Hackathon Organizer Assistant powered by a system of specialized agents that automate and streamline every stage of hackathon planning.

# It helps you:
<img width="806" height="373" alt="image" src="https://github.com/user-attachments/assets/42de1ba9-2ada-4960-8c4c-a8d350ac4477" />
<img width="806" height="534" alt="image" src="https://github.com/user-attachments/assets/27739ce2-a37c-4fcc-ac2f-6db0d0c79242" />

- Find and reach out to sponsors, write contextual emails, follow up, and log progress
- Search for venues, call vendors with Vapi, negotiate pricing, and track details
- Coordinate bussing and catering, automatically call around for quotes and log everything
- Generate a content calendar with posts, reels, and emails using Claude and Gemini
- Schedule and log Instagram posts, with AI-generated visuals
- Manage outreach for mentors, speakers, and communities
- Auto-generate websites, hackathon applications, and answer FAQs
- Everything is coordinated through a central spreadsheet system and connected via n8n workflows that use agents from Claude, Gemini, Fetch.ai, Unify, Orkes, Groq, Vapi, and letta.ai.

# How we built it
<img width="806" height="453" alt="image" src="https://github.com/user-attachments/assets/00df6baa-4396-4986-b147-80caa6469bbc" />

- Claude (via Fetch.ai uAgents): Content generation, email writing, route suggestions, sponsor research
- Gemini: Generated visuals (posts, reels), swag design, website copy
- Vapi: Outbound voice calls for bus quotes, venue calls, meal vendor outreach
- n8n: Our orchestration layer; we built a suite of agent-based workflows across outreach, logistics, and marketing
- Google Sheets API: All metadata is logged to editable and synced spreadsheets
- Groq, Orkes: Integrated to power backend services, real-time decisioning, and scalable processing
- Frontend: Simple interface to add and edit hackathon metadata (in progress)

<img width="806" height="256" alt="image" src="https://github.com/user-attachments/assets/00a802b0-6655-467e-8b2d-b0575208e7d1" />
