import { useEffect, useState } from "react";

const CONNECT_TIMEOUT_MS = 10_000;
const RETRY_INTERVAL_MS = 1_000;

/** Opens the document WebSocket as early as possible, independent of the editor. */
export default function useDocumentSocket(uri: string) {
  const [socket, setSocket] = useState<WebSocket>();

  useEffect(() => {
    let active = true;
    let ws: WebSocket | undefined;
    let connecting = false;
    let connectTimeoutId: number | undefined;
    let retryIntervalId: number | undefined;

    function clearConnectTimeout() {
      if (connectTimeoutId !== undefined) {
        window.clearTimeout(connectTimeoutId);
        connectTimeoutId = undefined;
      }
    }

    function tryConnect() {
      if (!active || connecting || ws) return;
      connecting = true;

      const next = new WebSocket(uri);
      connectTimeoutId = window.setTimeout(() => {
        if (connecting && ws !== next) {
          next.close();
          connecting = false;
        }
      }, CONNECT_TIMEOUT_MS);

      next.onopen = () => {
        if (!active) {
          next.close();
          return;
        }
        clearConnectTimeout();
        connecting = false;
        ws = next;
        setSocket(next);
      };

      next.onclose = () => {
        clearConnectTimeout();
        if (ws === next) {
          ws = undefined;
          setSocket(undefined);
        } else {
          connecting = false;
        }
      };
    }

    setSocket(undefined);
    tryConnect();
    retryIntervalId = window.setInterval(tryConnect, RETRY_INTERVAL_MS);

    return () => {
      active = false;
      if (retryIntervalId !== undefined) {
        window.clearInterval(retryIntervalId);
      }
      clearConnectTimeout();
      ws?.close();
      ws = undefined;
      setSocket(undefined);
    };
  }, [uri]);

  return socket;
}
