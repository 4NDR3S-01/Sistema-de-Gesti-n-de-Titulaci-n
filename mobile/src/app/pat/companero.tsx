import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { Search, UserPlus, UsersRound } from "lucide-react-native";
import { Avatar, Banner, Button, Card, EmptyState, Input, Screen, T } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { colors } from "@/lib/theme";

type Result = { id: number; name: string; email: string; cedula: string | null };

/** Busca e invita al compañero/a de un trabajo en pareja. */
export default function Teammate() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [inviting, setInviting] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const value = text.trim();
    if (value.length < 3) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get<{ results: Result[] }>(`/api/v1/students/teammates?q=${encodeURIComponent(value)}`);
        if (!cancelled) {
          setResults(data.results);
          setSearched(true);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "No se pudo buscar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  async function invite(result: Result) {
    setInviting(result.id);
    setError("");
    try {
      await api.post("/api/v1/pat/teammate", { studentId: result.id });
      router.back();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "No se pudo enviar la invitación.");
      setInviting(null);
    }
  }

  const short = text.trim().length < 3;

  return (
    <Screen edges={[]}>
      <T variant="small">
        Busca por nombres, apellidos o cédula. Solo aparecen estudiantes activos de tu carrera que aún no tienen un registro PAT 2. Tu compañero/a verá la invitación al abrir la app.
      </T>
      <View>
        <View style={{ position: "absolute", left: 14, top: 0, bottom: 0, justifyContent: "center", zIndex: 1 }} pointerEvents="none">
          <Search color={colors.faint} size={18} />
        </View>
        <Input value={text} onChangeText={setText} placeholder="Ej. Loor o 1314…" autoFocus autoCorrect={false} style={{ paddingLeft: 42, paddingRight: 42 }} accessibilityLabel="Buscar compañero/a" />
        {loading ? <ActivityIndicator color={colors.uleam} style={{ position: "absolute", right: 14, top: 14 }} /> : null}
      </View>
      {error ? <Banner tone="danger">{error}</Banner> : null}

      {short ? (
        <EmptyState icon={UsersRound} title="Encuentra a tu compañero/a">
          Escribe al menos 3 letras de su nombre o los primeros dígitos de su cédula.
        </EmptyState>
      ) : searched && results.length === 0 && !loading ? (
        <EmptyState icon={Search} title="Sin resultados">
          {`No hay estudiantes disponibles con «${text.trim()}». Verifica que sea de tu carrera y que secretaría lo haya registrado.`}
        </EmptyState>
      ) : (
        <Card padded={false}>
          {results.map((result, index) => (
            <View key={result.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: index ? 1 : 0, borderTopColor: colors.line }}>
              <Avatar name={result.name} size={38} />
              <View style={{ flex: 1 }}>
                <T variant="label" color={colors.ink}>
                  {result.name}
                </T>
                <T variant="small" numberOfLines={1}>
                  {result.email}
                  {result.cedula ? ` · C.I. ${result.cedula}` : ""}
                </T>
              </View>
              <Button title="Invitar" icon={UserPlus} size="sm" loading={inviting === result.id} disabled={inviting !== null} onPress={() => invite(result)} />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
