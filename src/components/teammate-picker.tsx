"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { LoaderCircle, Search, UserPlus } from "lucide-react";
import { inviteTeammateAction } from "@/app/(app)/registro-pat-2/actions";

type Result = { id: number; name: string; email: string; cedula: string | null };

export function TeammatePicker({ replacing = false }: { replacing?: boolean }) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();
  const [inviting, setInviting] = useState<number | null>(null);
  const listId = useId();

  useEffect(() => {
    const value = text.trim();
    if (value.length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/estudiantes/companeros?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: Result[] };
        setResults(data.results ?? []);
        setSearched(true);
      } catch {
        /* búsqueda cancelada */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  const short = text.trim().length < 3;

  return (
    <div className="picker">
      <label className="picker-input">
        <span className="sr-only">Buscar compañero/a por nombre o cédula</span>
        <Search aria-hidden="true" />
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Busca por nombres, apellidos o cédula"
          autoComplete="off"
          role="combobox"
          aria-expanded={!short && results.length > 0}
          aria-controls={listId}
        />
        {loading && <LoaderCircle className="spin" aria-hidden="true" />}
      </label>
      <p className="field-hint">
        Solo aparecen estudiantes activos de tu carrera que aún no tienen un registro PAT 2.
      </p>

      {!short && (
        <ul className="picker-results" id={listId} role="listbox" aria-label="Resultados">
          {results.map((result) => (
            <li key={result.id} role="option" aria-selected={false}>
              <span className="picker-avatar" aria-hidden="true">
                {result.name
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")}
              </span>
              <span className="picker-text">
                <strong>{result.name}</strong>
                <small>
                  {result.email}
                  {result.cedula && ` · C.I. ${result.cedula}`}
                </small>
              </span>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                disabled={pending}
                onClick={() => {
                  setInviting(result.id);
                  startTransition(() => inviteTeammateAction(result.id));
                }}
              >
                {pending && inviting === result.id ? (
                  <LoaderCircle className="spin" aria-hidden="true" />
                ) : (
                  <UserPlus aria-hidden="true" />
                )}
                {replacing ? "Invitar en su lugar" : "Invitar"}
              </button>
            </li>
          ))}
          {searched && !loading && results.length === 0 && (
            <li className="picker-empty">
              No encontramos estudiantes disponibles con «{text.trim()}». Verifica que sea de tu
              carrera y que secretaría lo haya registrado.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
