import { createContext, useContext } from "react";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ userId, role, children }) {
  const notificationsState = useNotifications({ userId, role });

  return (
    <NotificationsContext.Provider value={notificationsState}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotificationsContext must be used inside NotificationsProvider"
    );
  }
  return ctx;
}
