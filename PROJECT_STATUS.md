# EXΩ Project Status

**Last Updated:** June 4, 2026  
**Current Working Branch:** main

---

## 🎯 Project Overview

EXΩ is an Athens-based venue discovery and itinerary planning app. Users can browse venues, plan multi-stop itineraries, and get personalized recommendations.

---

## ✅ COMPLETED FEATURES

### Core Features (Main Branch)
- **Venue Management**: Full CRUD for venues with image uploads
- **Google Places Integration**: Auto-populate venue details (address, phone, website, opening hours from Google API)
- **Opening Hours (JSON)**: All 7 days stored as JSON, frontend shows only current day's hours (or "Closed today")
- **Google Maps Link Parser**: Parse both full and shortened Google Maps URLs to extract coordinates; fallback to Google Places API search with address
- **Itinerary Generator**: AI-powered itinerary builder
  - Smart category sequencing (food → bars → nightcap)
  - Haversine distance calculations
  - Walk/taxi recommendations based on distance
  - Skip same-category venues when starting from a venue card
- **Admin Panel**:
  - Venue CRUD with publish/draft status
  - Category & subcategory management
  - User management (create, edit password, delete)
  - **NEW: Venue Statistics** (total, published, draft counts)
  - **NEW: Venue Search** by name (case-insensitive)
  - **NEW: Category & Subcategory Filters**
  - **NEW: Clear Filters Button** (red, matches search box height)
- **Modern UI**: Tailwind CSS, responsive design, inline map expansion
- **Database**: SQLite with migrations system (backup/verify/rollback)
- **Authentication**: JWT-based login with role-based access (admin/creator)

---

## 🚧 IN PROGRESS / STASHED

### LLM Chat Feature (STASHED on `llm` branch)
**Status:** Complete and working locally, NOT merged to main yet

**What's Been Done:**
1. ✅ Installed `@anthropic-ai/sdk` in backend
2. ✅ Added `ANTHROPIC_API_KEY` to `.env`
3. ✅ Created `/api/chat` endpoint in `backend/routes.js`
   - Fetches all published venues from DB
   - Extracts today's opening hours from JSON
   - Builds system prompt with venue context
   - Calls Claude Haiku with full message history
4. ✅ Created `ChatView.tsx` component
   - Full chat UI with message bubbles, typing indicator, auto-scroll
   - Message history support
5. ✅ Integrated Chat into main navigation
   - New "Chat" page accessible from header
   - Added to BottomTabBar for mobile
6. ✅ Rebranded from "Ask Claude" to "Ask EXΩ"
7. ✅ Removed suggested prompt buttons (clean interface)

**Commits on `llm` branch:**
- 5deb52d: Add Claude LLM chat feature to EXΩ
- c4e38fa: Rebrand chat from 'Ask Claude' to 'Ask EXΩ'
- c13bb33: Remove suggested prompts from chat

**To Deploy LLM:**
1. Add `ANTHROPIC_API_KEY` to Render environment variables
2. Run: `git checkout main && git merge llm && git push origin main`
3. Render will auto-deploy

---

## 🎛️ Current Branches

| Branch | Status | Purpose |
|--------|--------|---------|
| `main` | Active | Production code, all core features + admin enhancements |
| `llm` | Stashed | Claude chat feature (ready to merge) |
| `admin-enhancements` | Merged to main | Venue stats, search, filters (✅ complete) |

---

## 🗄️ Database Schema

### Venues Table
```
id, name, category, subcategory_id, latitude, longitude, address, 
image_url, website_url, phone_number, reservation_link, rating, 
opening_hours (JSON: {"0":"09:00-22:00","1":"CLOSED",...}),
status (published/draft), created_at, updated_at
```

### Opening Hours JSON Format
```json
{
  "0": "09:00-22:00",  // Sunday
  "1": "09:00-22:00",  // Monday
  "2": "CLOSED",       // Tuesday
  "3": "09:00-22:00",  // Wednesday
  "4": "09:00-22:00",  // Thursday
  "5": "09:00-22:00",  // Friday
  "6": "09:00-22:00"   // Saturday
}
```

---

## 🔑 Key Implementation Details

### Admin Panel Search & Filters
- **Search**: Case-insensitive venue name search
- **Category Filter**: Dropdown of all categories
- **Subcategory Filter**: Dynamically populated based on selected category
- **Clear Button**: Resets all filters to defaults
- **Logic**: AND operation (search AND category AND subcategory)

### LLM Integration
- **Model**: Claude Haiku (fast & cost-effective)
- **Context**: System prompt includes all published venues with today's operating hours
- **No External Data**: Claude only knows venues in the database
- **Full History**: Each message includes conversation history for context

### Opening Hours Flow
1. **Admin adds venue**: Can manually enter hours or search Google Places
2. **Google API**: Auto-populates all 7 days as JSON
3. **Database**: Stores as single `opening_hours` TEXT column
4. **Frontend**: Parses JSON, extracts current day, displays "HH:MM - HH:MM" or "Closed today"
5. **Itinerary**: Shows current day's hours for each stop

---

## 📋 Environment Variables

### Backend (`.env`)
```
PORT=5001
JWT_SECRET=exo-app-secret-key-change-in-production
GOOGLE_PLACES_API_KEY=AIzaSyB...
ANTHROPIC_API_KEY=sk-ant-api03-...  [FOR LLM FEATURE]
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env` in frontend/)
```
VITE_API_URL=http://localhost:5001
```

### Render (Environment Variables)
- Same as backend `.env`
- Plus `ANTHROPIC_API_KEY` when LLM is deployed

---

## 🚀 Next Steps

### To Deploy LLM to Production:
1. Add `ANTHROPIC_API_KEY` to Render backend service settings
2. Merge `llm` branch to `main`
3. Push to trigger Render redeploy

### Potential Future Enhancements:
- [ ] User authentication on frontend (remember login token)
- [ ] Favorites/saved itineraries
- [ ] Share itinerary links
- [ ] More LLM features (venue descriptions, guided tours)
- [ ] Real-time availability/reservations
- [ ] User reviews/ratings

---

## 📊 Statistics (as of last session)

- **Total Venues in DB**: 7 (all published)
- **Categories**: Food, Bar, Dessert/Nightcap, etc.
- **Migrations**: 4 (initial schema, role constraint, opening_time/closing_time, opening_hours JSON)
- **API Endpoints**: 30+ (auth, venues, categories, itinerary, chat, etc.)

---

## 🔗 Key External APIs

- **Google Places API**: Venue search, details, opening hours
- **Google Maps**: Link parsing for coordinates
- **Anthropic API**: Claude AI for chat feature

---

## ⚠️ Known Considerations

1. **Database Files**: `.db`, `.db-shm`, `.db-wal` are in `.gitignore` — each environment has its own fresh DB
2. **Migrations**: Always backward-compatible; data is preserved during schema changes
3. **CORS**: Configured for localhost dev and Render production domains
4. **Opening Hours**: Stored as JSON to support multiple days; frontend always extracts current day
5. **LLM Context**: Claude only sees venues that are published; deleted venues won't be in chat context

---

## 🎓 Getting Started (After Claude Restart)

1. Read this file to understand current state
2. Check memory files at `.claude/projects/-Users-andrew-Desktop-development-exo/memory/`
3. Review git log: `git log --oneline -10`
4. Check branches: `git branch -a`
5. If continuing LLM work: `git checkout llm` then test locally before merging
6. If working on new features: Create new branch from `main`

---

## 📞 Current Status Summary

✅ **Main branch is production-ready** with all core features and admin enhancements
⏳ **LLM feature is complete and tested**, waiting to be deployed
🎯 **Next major feature**: Determine based on user priorities

For detailed commit history, see git log. For individual feature details, check git commits on respective branches.
