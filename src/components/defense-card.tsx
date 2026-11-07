import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { TribunalRow } from "@/lib/data/tribunals";
import { longDate } from "@/lib/labels";

export function DefenseDetails({ tribunal }: { tribunal: TribunalRow }) {
  return (
    <div className="defense-card">
      <div className="defense-when">
        <span>
          <CalendarDays aria-hidden="true" />
          {longDate(tribunal.defense_date)}
        </span>
        <span>
          <Clock aria-hidden="true" />
          {tribunal.defense_time}
        </span>
        <span>
          <MapPin aria-hidden="true" />
          {tribunal.place}
        </span>
      </div>
      <ul className="member-list">
        <li>
          <strong>{tribunal.president}</strong>
          <small>Preside</small>
        </li>
        <li>
          <strong>{tribunal.member_one}</strong>
          <small>Docente evaluador</small>
        </li>
        <li>
          <strong>{tribunal.member_two}</strong>
          <small>Docente evaluador</small>
        </li>
        <li>
          <span>{tribunal.tutor}</span>
          <small>Tutor/a, observador/a</small>
        </li>
      </ul>
    </div>
  );
}
