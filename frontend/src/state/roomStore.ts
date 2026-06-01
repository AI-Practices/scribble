import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren
} from "react";
import { api, type RoomSessionResponse, type RoomSnapshot } from "../services/api";

export interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  isHost: boolean;
  error: string | null;
  isLoading: boolean;
  connectionIssue: boolean;
}

type Listener = () => void;

class RoomStore {
  private state: RoomState = {
    room: null,
    participantId: null,
    isHost: false,
    error: null,
    isLoading: false,
    connectionIssue: false
  };

  private listeners = new Set<Listener>();
  private _pollIntervalId: ReturnType<typeof setInterval> | null = null;
  private _consecutivePollFailures = 0;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private setState(nextState: Partial<RoomState>) {
    this.state = {
      ...this.state,
      ...nextState
    };
    this.listeners.forEach((listener) => listener());
  }

  private async withLoading<T>(operation: () => Promise<T>) {
    this.setState({
      isLoading: true,
      error: null
    });

    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected request failure";
      this.setState({ error: message });
      throw error;
    } finally {
      this.setState({ isLoading: false });
    }
  }

  setRoomSession(response: RoomSessionResponse) {
    this.setState({
      participantId: response.participantId,
      room: response.room,
      isHost: response.participantId === response.room.hostId,
      error: null
    });
  }

  setRoomSnapshot(room: RoomSnapshot) {
    this.setState({
      room,
      isHost: !!(this.state.participantId && this.state.participantId === room.hostId),
      error: null
    });
  }

  async createRoom(playerName: string) {
    const response = await this.withLoading(() => api.createRoom(playerName));
    this.setRoomSession(response);
    return response;
  }

  async joinRoom(code: string, playerName: string) {
    const response = await this.withLoading(() => api.joinRoom(code, playerName));
    this.setRoomSession(response);
    return response;
  }

  async fetchRoom() {
    if (!this.state.room) {
      return null;
    }

    const response = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
    this.setRoomSnapshot(response.room);
    return response.room;
  }

  startPolling(intervalMs: number) {
    this.stopPolling();

    this._pollIntervalId = setInterval(async () => {
      try {
        if (!this.state.room) {
          return;
        }

        const snapshot = await api.fetchRoom(this.state.room.code, this.state.participantId ?? undefined);
        this.setRoomSnapshot(snapshot.room);
        this._consecutivePollFailures = 0;
        if (this.state.connectionIssue) {
          this.setState({ connectionIssue: false });
        }
      } catch {
        this._consecutivePollFailures += 1;
        if (this._consecutivePollFailures >= 2 && !this.state.connectionIssue) {
          this.setState({ connectionIssue: true });
        }
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this._pollIntervalId !== null) {
      clearInterval(this._pollIntervalId);
      this._pollIntervalId = null;
    }
  }
}

const RoomStoreContext = createContext<RoomStore | null>(null);

export function RoomStoreProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<RoomStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new RoomStore();
  }

  useEffect(() => undefined, []);

  return createElement(RoomStoreContext.Provider, { value: storeRef.current }, children);
}

export function useRoomStore() {
  const store = useContext(RoomStoreContext);

  if (!store) {
    throw new Error("RoomStoreProvider is missing");
  }

  return store;
}

export function useRoomState() {
  const store = useRoomStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
