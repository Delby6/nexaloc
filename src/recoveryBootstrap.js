// Runs BEFORE React mounts
export function bootstrapPasswordRecovery() {
  const hash = window.location.hash || "";
  const search = window.location.search || "";

  // Detect Supabase recovery link
  if (
    hash.includes("type=recovery") ||
    search.includes("type=recovery")
  ) {
    sessionStorage.setItem("password_recovery", "true");

    // Force correct route immediately
    if (!window.location.pathname.startsWith("/reset-password")) {
      window.history.replaceState(
        {},
        "",
        "/reset-password" + hash
      );
    }
  }
}
