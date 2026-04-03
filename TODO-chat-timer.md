# Chat.tsx Persistent Timer (15h, survives refresh) - COMPLETE

## Steps:
- [x] 1. Create TODO for Chat.tsx timer
- [x] 2. Refactor timer to use localStorage start timestamp (`chatTimer_${eventId}_${participantId}`)
- [x] 3. Calculate remaining time precisely every second (no drift)
- [x] 4. Disable messaging when expired (`timeLeft <= 0`), show "EXPIRED" in red
- [x] 5. Test persistence across refreshes

**Changes in src/assets/Chat.tsx: Timer now persists per unique chat session (15h total), survives refresh/reload.**
