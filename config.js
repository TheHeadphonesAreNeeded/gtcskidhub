// ============================================
// SKIDHUB — EDIT THIS FILE TO UPDATE THE PAGE
// ============================================
// Change these values any time and redeploy (or if using Netlify's
// git integration, just push — it rebuilds automatically).

window.SKIDHUB_CONFIG = {

  // Overall build progress, shown as the bar + percentage.
  progress: 62,

  // Each module shown in the status panel.
  // status can be: "ready", "building", or "locked"
  modules: [
    { name: "Main website", status: "Building" },
    { name: "Skidded stuff",      status: "locked" },
    { name: "Member tools",        status: "locked" },
    { name: "Community access",    status: "locked" }
  ],

  // Unique key for the live waiting-list counter (see script.js).
  // Change this to something unique to you so your count doesn't
  // collide with anyone else using this same template.
  counterNamespace: "skidhub-a91k",
  counterKey: "waiting"

};
