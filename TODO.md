## TODO: Fix QR Scan -> Picture Redirect

### Plan Steps:
- [x] 1. Create TODO.md 
- [x] 2. Initial auto-redirect for root /
- [x] 3. Update DateQr.tsx: Auto-redirect /date-qr/:eventId -> /picture/:eventId 
- [ ] 4. Test: admin create -> /date-qr/{id} or root -> Picture
- [ ] 5. Test generated QR (/picture/{id}) -> Picture upload
- [ ] 6. `npm run dev` local test
- [ ] 7. Deploy Vercel
- [ ] 8. Complete

Current: Reverted DateQr: Admin Generate QR -> /date-qr/{id} shows QR page. Root / scan -> Picture via session. /picture/{id} QR -> Picture direct. Ready for test/deploy.
