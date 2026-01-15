import { useEffect, useState, useRef } from "react";
import { API_BASE } from "@/lib/apiBase";


export default function useSystemHealth(interval = 5000, maxPoints = 30) {
  const [data, setData] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    async function ping() {
      const start = performance.now();
      try {
        const res = await fetch(`${API_BASE}/api/ai/ping`);
        const ms = Math.round(performance.now() - start);

        setData((prev) => {
          const next = [...prev, { time: Date.now(), ms, ok }];
          return next.slice(-maxPoints);
        });
      } catch (err) {
        const ms = Math.round(performance.now() - start);
        setData((prev) => {
          const next = [...prev, { time: Date.now(), ms, ok: false }];
          return next.slice(-maxPoints);
        });
      }
    }

    // First ping immediately
    ping();

    timerRef.current = setInterval(ping, interval);
    return () => clearInterval(timerRef.current);
  }, [interval, maxPoints]);

  return data;
}
