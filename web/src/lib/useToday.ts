import { useLocation } from "react-router-dom";
import { isoDate } from "./plan";

/** `?date=2026-11-21` previews a page as of another day. */
export function useToday(): string {
  const { search } = useLocation();
  const override = new URLSearchParams(search).get("date");
  return override && /^\d{4}-\d{2}-\d{2}$/.test(override) ? override : isoDate(new Date());
}
