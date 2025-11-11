# 🔄 Calendar Sync Button - Setup Guide

## What Was Added

✅ **Calendar Sync Button** on the Meetings page  
✅ **API Integration** with merlin_heart backend  
✅ **Loading States** with animated spinner  
✅ **Success/Error Feedback** with auto-dismiss  
✅ **User Email Detection** from auth context  

---

## 📋 Setup Steps

### 1. Add API URL to `.env`

Open `/Users/dominiquemb/dev/merlin/.env` and add:

```bash
REACT_APP_API_URL=http://localhost:8000
```

Your `.env` should now look like:
```bash
REACT_APP_SUPABASE_URL=https://flgevxkdyhvgfchgfgdl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
REACT_APP_API_URL=http://localhost:8000
```

### 2. Restart the React App

After adding the environment variable, restart the React app:

```bash
cd /Users/dominiquemb/dev/merlin
npm start
```

---

## 🚀 How to Test

### Step 1: Start the Backend API

In one terminal, start the merlin_heart API:

```bash
cd /Users/dominiquemb/dev/merlin_heart
python main.py
```

You should see: `Uvicorn running on http://127.0.0.1:8000`

### Step 2: Start the React App

In another terminal, start the React app (if not already running):

```bash
cd /Users/dominiquemb/dev/merlin
npm start
```

### Step 3: Test the Sync Button

1. **Log in** to the Merlin app
2. Navigate to **Meetings** page
3. Look for the **"Sync Calendar"** button below the credits badge
4. Click the button
5. Watch the states:
   - **Loading**: "Syncing Calendar..." with spinning icon
   - **Success**: Green background with "Synced X meetings!"
   - **Error**: Red background with error message

---

## 🎨 Button States

### Default State
```
┌──────────────────────────────┐
│  🔄  Sync Calendar           │  ← White button
└──────────────────────────────┘
```

### Loading State
```
┌──────────────────────────────┐
│  ⟳  Syncing Calendar...      │  ← Spinning icon
└──────────────────────────────┘
```

### Success State (3 seconds)
```
┌──────────────────────────────┐
│  ✓  Synced 5 meetings!       │  ← Green background
└──────────────────────────────┘
```

### Error State (5 seconds)
```
┌──────────────────────────────┐
│  ✗  No auth token found      │  ← Red background
└──────────────────────────────┘
```

---

## 📁 Files Created/Modified

### New Files:
```
/Users/dominiquemb/dev/merlin/src/lib/calendarApi.js
```
- API utility functions for calendar sync
- `syncUserCalendar(email, daysAhead)` - Triggers sync
- `getCalendarSyncStatus(email)` - Gets sync status
- `checkApiHealth()` - Checks if API is running

### Modified Files:
```
/Users/dominiquemb/dev/merlin/src/pages/Meetings.jsx
```
- Added calendar sync button
- Added loading/success/error states
- Integrated with AuthContext for user email
- Auto-dismiss success/error messages

### Environment:
```
/Users/dominiquemb/dev/merlin/.env
```
- Add: `REACT_APP_API_URL=http://localhost:8000`

---

## 🔧 Technical Details

### API Call Flow

```
User clicks button
       ↓
Get user.email from AuthContext
       ↓
Call syncUserCalendar(email, 7)
       ↓
POST http://localhost:8000/calendar/sync
       ↓
Backend syncs calendar (5-30 seconds)
       ↓
Return { success: true, events_synced: 5 }
       ↓
Show success message
       ↓
Auto-dismiss after 3 seconds
```

### State Management

```javascript
const [isSyncing, setIsSyncing] = useState(false);       // Loading state
const [syncStatus, setSyncStatus] = useState(null);      // 'success', 'error', null
const [syncMessage, setSyncMessage] = useState('');      // Message to display
```

### Error Handling

The button handles these error cases:
- ✅ No user email (not logged in)
- ✅ API not reachable (backend down)
- ✅ Calendar provider issues (invalid token)
- ✅ Network errors

---

## 🧪 Testing Checklist

- [ ] **Backend running** - Start merlin_heart API
- [ ] **React app running** - Start Merlin frontend
- [ ] **Environment variable set** - Add `REACT_APP_API_URL`
- [ ] **User logged in** - Sign in with Google/Microsoft
- [ ] **Calendar connected** - User has OAuth token
- [ ] **Click sync button** - Test the sync functionality
- [ ] **Check loading state** - Spinner appears
- [ ] **Check success state** - Green message shows
- [ ] **Check auto-dismiss** - Message disappears after 3s

---

## 🐛 Troubleshooting

### Button shows "No user email found"
**Problem**: User not logged in or AuthContext not providing email  
**Solution**: Make sure you're logged in and OAuth is working

### Button shows "Failed to sync calendar"
**Problem**: Backend API not running or not reachable  
**Solution**: 
```bash
# Check if backend is running
curl http://localhost:8000/docs

# If not, start it
cd /Users/dominiquemb/dev/merlin_heart
python main.py
```

### Button shows "No auth token found"
**Problem**: User hasn't connected their calendar via OAuth  
**Solution**: User needs to connect Google Calendar or Outlook

### Nothing happens when clicking button
**Problem**: API URL not set or incorrect  
**Solution**: Check `.env` has `REACT_APP_API_URL=http://localhost:8000`

### CORS errors in console
**Problem**: Backend not configured for frontend origin  
**Solution**: Check `merlin_heart/main.py` CORS settings

---

## 🎯 What Happens After Sync?

```
1. User clicks "Sync Calendar"
         ↓
2. API fetches calendar events from Google/Microsoft
         ↓
3. Events saved to database (calendar_events table)
         ↓
4. Events marked as "pending" for enrichment
         ↓
5. briefs.py job enriches the events (automatic)
         ↓
6. Research briefs generated with insights
         ↓
7. User receives email with meeting prep
```

---

## 📊 API Response Examples

### Success Response:
```json
{
  "success": true,
  "message": "Successfully synced 5 events for user@example.com",
  "email": "user@example.com",
  "events_synced": 5,
  "events_deleted": 1,
  "provider": "google"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Failed to sync calendar for user@example.com",
  "email": "user@example.com",
  "events_synced": 0,
  "error": "No auth token found"
}
```

---

## 🚦 Production Deployment

When deploying to production:

1. **Update `.env.production`**:
   ```bash
   REACT_APP_API_URL=https://your-api-domain.com
   ```

2. **Update CORS in merlin_heart**:
   ```python
   # main.py
   allow_origins=["https://your-frontend-domain.com"]
   ```

3. **Build React app**:
   ```bash
   npm run build
   ```

---

## 📚 Related Documentation

- **Calendar Sync API**: `/Users/dominiquemb/dev/merlin_heart/documentation/calendar_sync_api.md`
- **Quick Start**: `/Users/dominiquemb/dev/merlin_heart/CALENDAR_SYNC_QUICKSTART.md`
- **API Tests**: `/Users/dominiquemb/dev/merlin_heart/tests/test_calendar_sync_api.py`

---

## ✅ Summary

You now have a fully functional "Sync Calendar" button that:
- ✅ Triggers calendar sync for the logged-in user
- ✅ Shows loading states with animation
- ✅ Displays success/error feedback
- ✅ Auto-dismisses messages
- ✅ Handles all error cases gracefully
- ✅ Integrates seamlessly with existing UI

**Ready to test!** 🎉

---

**Last Updated**: November 7, 2025


