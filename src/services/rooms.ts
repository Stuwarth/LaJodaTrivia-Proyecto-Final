import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export type RoomState = {
  code: string;
  host: string; // uid
  createdAt: number;
  stage: 'lobby' | 'question' | 'reveal' | 'results';
  players?: Record<string, { alias?: string; joinedAt: number }>; // optional richer model later
};

export type SpinState = {
  seed: number; // shared seed
  startedAt: number; // ms epoch
  durationMs: number; // animation duration
  result?: string; // category result (optional until resolved)
};

function genCode(len = 5): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function startRoom(code: string): Promise<void> {
  // Simple stage flip to start the game
  await database().ref(`/rooms/${code}/stage`).set('question');
}

export async function leaveRoom(code: string): Promise<void> {
  const user = auth().currentUser;
  if (!user) return;
  const uid = user.uid;
  // Remove presence
  await database().ref(`/presence/${code}/${uid}`).remove();
  // Remove from players
  await database().ref(`/rooms/${code}/players/${uid}`).remove();
  // If room empty, delete
  const playersSnap = await database().ref(`/rooms/${code}/players`).once('value');
  if (!playersSnap.exists()) {
    await database().ref(`/rooms/${code}`).remove();
  }
}

export async function createRoom(): Promise<string> {
  const user = auth().currentUser;
  if (!user) throw new Error('No auth user');

  const now = Date.now();
  const alias = user.displayName || user.email || 'Invitado';

  let lastErr: any = null;
  for (let i = 0; i < 10; i++) {
    const code = genCode();
    try {
      const ref = database().ref(`/rooms/${code}`);
      const tx = await ref.transaction((cur) => {
        if (cur) return cur; // collision, keep existing
        const room: RoomState = { code, host: user.uid, createdAt: now, stage: 'lobby' };
        return { ...room, players: { [user.uid]: { alias, joinedAt: now } } };
      }, undefined, false);
      if (!tx.committed || !tx.snapshot?.exists()) {
        // Try another code if collision
        continue;
      }

      // Add presence for creator
      const presenceRef = database().ref(`/presence/${code}/${user.uid}`);
      await presenceRef.set({ online: true, at: now, alias });
      presenceRef.onDisconnect().remove();

      return code;
    } catch (e: any) {
      lastErr = e;
      // If the code already exists, our rules may reject with permission-denied. Retry with a new code.
      const codeStr = String(e?.code || e?.message || '');
      if (codeStr.includes('permission-denied')) {
        continue;
      }
      throw e;
    }
  }
  throw new Error(lastErr?.message || 'No se pudo crear la sala, intenta nuevamente');
}

export async function joinRoom(code: string): Promise<void> {
  const user = auth().currentUser;
  if (!user) throw new Error('No auth user');
  const now = Date.now();
  const alias = user.displayName || user.email || 'Invitado';
  try {
    // Escribir directamente en players; las reglas permiten si la sala existe
    await database().ref(`/rooms/${code}/players/${user.uid}`).set({ alias, joinedAt: now });
  } catch (e: any) {
    const msg = String(e?.code || e?.message || '');
    if (msg.includes('permission-denied')) throw new Error('Sala no existe');
    throw e;
  }

  const presenceRef = database().ref(`/presence/${code}/${user.uid}`);
  await presenceRef.set({ online: true, at: now, alias });
  presenceRef.onDisconnect().remove();
}

export function listenRoom(code: string, cb: (state: RoomState | null) => void): () => void {
  const ref = database().ref(`/rooms/${code}`);
  const handler = ref.on('value', snap => {
    cb((snap.val() as RoomState) || null);
  });
  return () => ref.off('value', handler);
}

export function listenPresence(code: string, cb: (players: Record<string, any> | null) => void): () => void {
  const ref = database().ref(`/presence/${code}`);
  const handler = ref.on('value', snap => cb((snap.val() as Record<string, any>) || null));
  return () => ref.off('value', handler);
}

export function listenSpin(code: string, cb: (spin: SpinState | null) => void): () => void {
  const ref = database().ref(`/rooms/${code}/spin`);
  const handler = ref.on('value', snap => cb((snap.val() as SpinState) || null));
  return () => ref.off('value', handler);
}

export async function setSpin(code: string, spin: SpinState): Promise<void> {
  const user = auth().currentUser;
  if (!user) throw new Error('No auth user');
  await database().ref(`/rooms/${code}/spin`).set(spin);
}

export async function clearSpin(code: string): Promise<void> {
  await database().ref(`/rooms/${code}/spin`).remove();
}
