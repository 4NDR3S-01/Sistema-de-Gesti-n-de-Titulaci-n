import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Catalog } from "@/lib/types";

let cache: Catalog | null = null;

/** Opciones de los formularios (modalidades, provincias…), servidas por la API. */
export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(cache);
  useEffect(() => {
    if (cache) return;
    api.get<Catalog>("/api/v1/catalog").then((data) => {
      cache = data;
      setCatalog(data);
    });
  }, []);
  return catalog;
}
