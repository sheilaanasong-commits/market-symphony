/** Chargement d'une « symphonie » : préréglage ou période libre, annulé si la demande change. */
import { useEffect, useState } from "react";
import { fetchPresetSymphony, fetchSymphony } from "../lib/api";
import type { Preset, SymphonyResponse } from "../types/symphony";

export type SymphonyRequest =
  | { kind: "preset"; preset: Preset }
  | { kind: "custom"; ticker: string; start: string; end: string };

interface State {
  data?: SymphonyResponse;
  loading: boolean;
  error: string | null;
  offline: boolean;
}

export function useSymphony(request: SymphonyRequest | null): State {
  const [state, setState] = useState<State>({ loading: false, error: null, offline: false });
  const key = request && JSON.stringify(request); // dépendance stable

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    const load =
      request.kind === "preset"
        ? fetchPresetSymphony(request.preset, controller.signal)
        : fetchSymphony(request.ticker, request.start, request.end, controller.signal).then((data) => ({
            data,
            offline: false,
          }));

    load
      .then(({ data, offline }) => setState({ data, offline, loading: false, error: null }))
      .catch((err: Error) => {
        if (!controller.signal.aborted) setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` résume `request`
  }, [key]);

  return state;
}
