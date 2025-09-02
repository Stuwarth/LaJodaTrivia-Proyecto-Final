import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { createRoom } from './rooms';

/**
 * Simple 1v1 matchmaking using a single waiting slot under /queue/classic/waiting
 * - First caller becomes waiter and waits for a partner notification under /queue/classic/matched/{uid}
 * - Second caller consumes the waiter atomically, creates a room, and notifies the waiter
 */
export async function findMatch(): Promise<{ code: string }> {
  const user = auth().currentUser;
  if (!user) throw new Error('No auth user');
  const uid = user.uid;
  const waitingRef = database().ref('/queue/classic/waiting');
  // Clear any stale match notifications before starting a new attempt
  const myMatchedRef = database().ref(`/queue/classic/matched/${uid}`);
  try { await myMatchedRef.remove(); } catch {}

  let role: 'waiter' | 'second' | 'unknown' = 'unknown';
  let partnerUid: string | null = null;
  // Attempt the transaction up to 3 times to handle server retries
  for (let attempt = 0; attempt < 3 && role === 'unknown'; attempt++) {
    const txResult = await waitingRef.transaction((current) => {
      if (!current) {
        // No one waiting -> become waiter
        return { uid, at: Date.now() };
      }
      if (current && current.uid && current.uid !== uid) {
        // Someone else waiting -> consume and clear slot
        partnerUid = current.uid;
        return null;
      }
      // Already me waiting or unexpected -> keep
      return current;
    }, undefined, false);

    if (!txResult.committed) {
      // loop and try again
      continue;
    }
    const val = txResult.snapshot?.val();
    if (partnerUid) {
      role = 'second';
      break;
    }
    if (val && val.uid === uid) {
      role = 'waiter';
      break;
    }
    // Otherwise, try again
  }

  if (role === 'second' && partnerUid) {
    // I matched as the second player. To avoid rare double-creation races, acquire a simple lock.
    const creatingRef = database().ref('/queue/classic/creating');
    let iAmCreator = false;
    const tx = await creatingRef.transaction((cur) => {
      if (!cur) return uid; // acquire
      return cur; // someone else creating
    }, undefined, false);
    iAmCreator = !!(tx.committed && tx.snapshot && tx.snapshot.val() === uid);

  if (iAmCreator) {
      // Safety: ensure lock is removed if app disconnects abruptly
      try { creatingRef.onDisconnect().remove(); } catch {}
      // Create room and notify both players to rely on the same code path
      const code = await createRoom();
      const payload = { code, at: Date.now(), a: partnerUid, b: uid };
      await Promise.all([
        database().ref(`/queue/classic/matched/${partnerUid}`).set(payload),
        database().ref(`/queue/classic/matched/${uid}`).set(payload),
      ]);
      // Release lock
  await creatingRef.remove().catch(() => {});
      return { code };
    } else {
      // Someone else will create; wait to be notified like a waiter
      const matchedRef = database().ref(`/queue/classic/matched/${uid}`);
      const code: string = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Tiempo de espera agotado')), 60000);
        matchedRef.on('value', (snap) => {
          const val = snap.val();
          if (val && val.code) {
            clearTimeout(timeout);
            matchedRef.off();
            resolve(val.code as string);
          }
        });
      });
      return { code };
    }
  }

  // I'm the waiter. Ensure cleanup on disconnect
  waitingRef.onDisconnect().remove();

  // Wait to be notified with a room code
  const matchedRef = myMatchedRef;
  const code: string = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Tiempo de espera agotado')), 60000);
    matchedRef.on('value', (snap) => {
      const val = snap.val();
      if (val && val.code) {
        clearTimeout(timeout);
        matchedRef.off();
        // also clear waiting just in case
        waitingRef.remove().catch(() => {});
        resolve(val.code as string);
      }
    });
  });

  return { code };
}

export async function cancelMatchmaking(): Promise<void> {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  await database().ref('/queue/classic/waiting').once('value').then(async (snap) => {
    const cur = snap.val();
    if (cur && cur.uid === uid) {
      await database().ref('/queue/classic/waiting').remove();
    }
  });
  await database().ref(`/queue/classic/matched/${uid}`).remove();
  // Try to release creation lock if owned
  await database().ref('/queue/classic/creating').once('value').then(async (snap) => {
    if (snap.exists() && snap.val() === uid) {
      await database().ref('/queue/classic/creating').remove().catch(() => {});
    }
  });
}
