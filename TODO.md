## TODO: Fix QR Scan -> Picture Redirect

### Plan Steps:
- [x] 1. Create TODO.md with steps
- [x] 2. Edit src/assets/DateQr.tsx: Add useEffect for root path auto-redirect to /picture/{sessionEventId}
- [ ] 3. Test admin create event -> scan root domain -> redirects to Picture
- [ ] 4. Test generated QR scan -> goes to Picture directly  
- [ ] 5. Local test: `npm run dev`
- [ ] 6. Deploy to Vercel & final test
- [ ] 7. Complete task

Current: DateQr.tsx updated with auto-redirect. Ready for testing.
