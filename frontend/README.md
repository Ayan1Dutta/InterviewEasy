# PeerPrep Frontend

Vite + React based UI for PeerPrep, the collaborative interview preparation platform.

## Features
* Monaco powered multi-language editor (JS / Java / C++)
* Real-time code + language sync over Socket.io
* Versioned full-snapshot reconciliation to prevent divergence
* WebRTC video chat & participant presence
* Debounced persistence to backend (MongoDB) with localStorage mirrors

## Dev Setup
```
npm install
npm run dev
```

Backend must be running separately. Update API / socket origins as needed.

## Branding
Favicon & navbar logo: `public/peerprep-logo.svg`.

---
This README replaces the default Vite template docs.
