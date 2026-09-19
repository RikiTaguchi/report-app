import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_BASE_URL } from "./api";

function wsUrl(): string {
  return API_BASE_URL.replace(/^http/, "ws") + "/ws";
}

let client: Client | null = null;
let connectPromise: Promise<void> | null = null;

function getClient(): Client {
  if (client) return client;
  client = new Client({
    brokerURL: wsUrl(),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });
  return client;
}

function connect(): Promise<void> {
  const c = getClient();
  if (c.connected) return Promise.resolve();
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    c.onConnect = () => resolve();
    c.onStompError = (frame) => reject(new Error(frame.headers["message"] ?? "STOMP error"));
    c.onWebSocketError = (event) => reject(event instanceof Error ? event : new Error("WebSocket error"));
    c.activate();
  });
  return connectPromise;
}

/**
 * Subscribes to a topic once connected. Returns an unsubscribe function.
 * Safe to call from multiple components; each call gets its own subscription.
 */
export function subscribeTopic<T>(
  destination: string,
  onMessage: (payload: T) => void
): () => void {
  let subscription: StompSubscription | null = null;
  let cancelled = false;

  connect()
    .then(() => {
      if (cancelled) return;
      subscription = getClient().subscribe(destination, (message: IMessage) => {
        try {
          onMessage(JSON.parse(message.body) as T);
        } catch {
          // ignore malformed payloads
        }
      });
    })
    .catch(() => {
      // connection failed (e.g. unauthenticated) — realtime updates simply won't arrive
    });

  return () => {
    cancelled = true;
    subscription?.unsubscribe();
  };
}

export function reportCommentsTopic(studentId: string, reportDate: string): string {
  return `/topic/reports/${studentId}/${reportDate}/comments`;
}

export function blogCommentsTopic(blogId: string): string {
  return `/topic/blogs/${blogId}/comments`;
}

export const REPORT_SUBMISSIONS_TOPIC = "/topic/report-submissions";
