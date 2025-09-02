import database from '@react-native-firebase/database';

export type BankQuestion = {
  id: string;
  category: string;
  type: 'multiple' | 'boolean';
  is18Plus?: boolean;
  question: string;
  options: string[]; // array de textos
  answerIndex: number; // índice correcto
  explanation?: string;
};

export type TriviaOption = { text: string; correct?: boolean };
export type TriviaQuestion = { id: string; category: string; prompt: string; options: TriviaOption[] };

export async function listCategories(): Promise<string[]> {
  const snap = await database().ref('/questions').once('value');
  const val = snap.val() as Record<string, any> | null;
  if (!val) return [];
  return Object.keys(val);
}

export async function getRandomQuestion(category: string, excludeIds: string[] = []): Promise<TriviaQuestion> {
  const ref = database().ref(`/questions/${category}`);
  const snap = await ref.once('value');
  const data = (snap.val() as Record<string, BankQuestion>) || {};
  const entries = Object.entries(data).filter(([id]) => !excludeIds.includes(id));
  if (entries.length === 0) throw new Error('No hay preguntas disponibles en esta categoría');
  const [id, q] = entries[Math.floor(Math.random() * entries.length)];
  const options: TriviaOption[] = (q.options || []).map((t, idx) => ({ text: t, correct: idx === q.answerIndex }));
  return { id, category, prompt: q.question, options };
}
