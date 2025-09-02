import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { getRandomQuestion } from './questions';

export type TriviaOption = { text: string; correct?: boolean };
export type TriviaQuestion = { id: string; category: string; prompt: string; options: TriviaOption[] };

async function writeRound(code: string, round: number, q: TriviaQuestion, durationMs = 15000) {
  const ref = database().ref(`/rooms/${code}`);
  // Use server time offset to avoid device clock skew
  const offSnap = await database().ref('.info/serverTimeOffset').once('value');
  const offset: number = (offSnap.val() as number) || 0;
  const serverNow = Date.now() + offset;
  // Batch update to reduce round-trips
  await ref.update({
    [`rounds/${round}`]: { question: q, category: q.category, questionId: q.id, createdAt: serverNow },
    roundTimer: { startAt: serverNow, durationMs },
    currentRound: round,
    stage: 'question',
  });
}

export async function startGame(code: string, category: string, durationMs = 15000, prefetched?: TriviaQuestion | null) {
  const ref = database().ref(`/rooms/${code}`);
  const usedIdsSnap = await ref.child('used').once('value');
  const used = (usedIdsSnap.val() as string[]) || [];
  let q: TriviaQuestion | null = null;
  if (prefetched && prefetched.category === category) {
    q = prefetched;
  } else {
    q = await getRandomQuestion(category, used);
  }
  // Batch reset scores + update used, then write round atomically
  await ref.update({ scores: null, used: [...used, q.id] });
  await writeRound(code, 1, q, durationMs);
}

export async function submitAnswer(code: string, optionIndex: number) {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('No auth user');
  const roundSnap = await database().ref(`/rooms/${code}/currentRound`).once('value');
  const round = roundSnap.val() || 1;
  await database().ref(`/rooms/${code}/rounds/${round}/answers/${uid}`).set({ optionIndex, at: Date.now() });
}

export async function goToReveal(code: string) {
  await database().ref(`/rooms/${code}/stage`).set('reveal');
}

export async function goToResults(code: string) {
  // Calculate and update scores for the round (points by correctness + remaining time)
  const ref = database().ref(`/rooms/${code}`);
  const [roundSnap, scoresSnap, timerSnap] = await Promise.all([
    ref.child('currentRound').once('value'),
    ref.child('scores').once('value'),
    ref.child('roundTimer').once('value'),
  ]);
  const round = roundSnap.val() || 1;
  const answersSnap = await ref.child(`rounds/${round}/answers`).once('value');
  const questionSnap = await ref.child(`rounds/${round}/question`).once('value');
  const q = (questionSnap.val() as TriviaQuestion) || null;
  const correctIdx = (q?.options || []).findIndex((o: any) => o.correct);
  const currentScores = (scoresSnap.val() as Record<string, number>) || {};
  const answers = (answersSnap.val() as Record<string, { optionIndex: number; at?: number }>) || {};
  const timer = (timerSnap.val() as { startAt?: number; durationMs?: number }) || {};
  const startAt = timer.startAt || 0;
  const durationMs = timer.durationMs || 15000;

  const perRoundPoints: Record<string, number> = {};
  const updatedScores: Record<string, number> = { ...currentScores };
  Object.entries(answers).forEach(([uid, a]) => {
    const isCorrect = a.optionIndex === correctIdx;
    let pts = 0;
    if (isCorrect) {
      const answeredAt = a.at || startAt + durationMs; // if missing, assume at end
      const remaining = Math.max(0, startAt + durationMs - answeredAt);
      const ratio = Math.max(0, Math.min(1, remaining / durationMs));
      // Points: base 500 + up to 500 by speed
      pts = Math.round(500 + 500 * ratio);
    }
    if (pts > 0) {
      perRoundPoints[uid] = pts;
      updatedScores[uid] = (updatedScores[uid] || 0) + pts;
    } else {
      perRoundPoints[uid] = 0;
      updatedScores[uid] = updatedScores[uid] || 0;
    }
  });

  await ref.update({
    scores: updatedScores,
    [`rounds/${round}/points`]: perRoundPoints,
    stage: 'results',
  });
}

export async function nextRound(code: string, category: string, durationMs = 15000) {
  const ref = database().ref(`/rooms/${code}`);
  const [currentSnap, usedSnap, settingsSnap] = await Promise.all([
    ref.child('currentRound').once('value'),
    ref.child('used').once('value'),
    ref.child('settings').once('value'),
  ]);
  const current = currentSnap.val() || 1;
  const used = (usedSnap.val() as string[]) || [];
  const settings = (settingsSnap.val() as { maxRounds?: number; roundsLimit?: number }) || {};
  const limit = settings.maxRounds || settings.roundsLimit || 0; // 0 means unlimited
  const next = current + 1;
  if (limit > 0 && next > limit) {
    await ref.child('stage').set('finished');
    return;
  }
  const q = await getRandomQuestion(category, used);
  await ref.update({ used: [...used, q.id] });
  await writeRound(code, next, q, durationMs);
}

export async function finishGame(code: string) {
  const ref = database().ref(`/rooms/${code}`);
  await ref.child('stage').set('finished');
  // Cleanup: if no players remain, delete room
  const playersSnap = await ref.child('players').once('value');
  const players = playersSnap.val() as Record<string, any> | null;
  if (!players || Object.keys(players).length === 0) {
    await ref.remove();
  }
}

// Prefetch next question for a category to reduce latency on start
export async function prefetchQuestion(code: string, category: string) {
  const ref = database().ref(`/rooms/${code}`);
  const usedSnap = await ref.child('used').once('value');
  const used = (usedSnap.val() as string[]) || [];
  const q = await getRandomQuestion(category, used);
  await ref.child('prefetch').set({ category, question: q, at: Date.now() });
}
