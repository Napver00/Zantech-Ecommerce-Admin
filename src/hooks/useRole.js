import { useEffect, useState } from "react";
import axiosInstance from "../config/axios";
import { storedRole } from "../config/access";

const EVENT = "zt:user";

/** The signed-in staff member's role; updates when the saved login changes. */
const useRole = () => {
  const [role, setRole] = useState(storedRole);

  useEffect(() => {
    const sync = () => setRole(storedRole());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync); // another tab signed in or out
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return role;
};

/**
 * Reloads the signed-in user once, so a role an admin changed since the last
 * sign-in takes effect without signing out and in again.
 */
export const refreshStoredUser = async () => {
  try {
    const res = await axiosInstance.get("/profile");
    const fresh = res.data?.data;
    if (!fresh) return;
    const saved = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...saved, ...fresh }));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* offline or signed out: keep the saved login */
  }
};

/** Call after saving a new login so open components pick up the role. */
export const announceUserChange = () => window.dispatchEvent(new Event(EVENT));

export default useRole;
