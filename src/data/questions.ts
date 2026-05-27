// =====================================================
// 📚 ICFES SHOOTER — Base de preguntas de inglés
// tipo 'vocab'   → disparo normal (1 bala)
// tipo 'grammar' → disparo doble (2 daño)
// tipo 'bonus'   → granada o escudo (especial)
// =====================================================

export interface Question {
  id:      number;
  text:    string;
  opts:    [string, string, string, string];
  ans:     0 | 1 | 2 | 3;   // índice de la respuesta correcta
  type:    'vocab' | 'grammar' | 'bonus';
  reward:  'bullet' | 'double' | 'grenade' | 'shield';
  diff:    1 | 2 | 3;
}

export const QUESTIONS: Question[] = [
  // ── VOCABULARIO ───────────────────────────────────────────────────────────
  {
    id: 1, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What does 'exhausted' mean?",
    opts: ['Very happy', 'Extremely tired', 'Confused', 'Hungry'],
    ans: 1,
  },
  {
    id: 2, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What is a synonym of 'brave'?",
    opts: ['Cowardly', 'Clever', 'Courageous', 'Careless'],
    ans: 2,
  },
  {
    id: 3, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What does 'enormous' mean?",
    opts: ['Very small', 'Very fast', 'Very old', 'Very large'],
    ans: 3,
  },
  {
    id: 4, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What does 'ancient' mean?",
    opts: ['Modern', 'Very old', 'Broken', 'Hidden'],
    ans: 1,
  },
  {
    id: 5, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What is the meaning of 'frequently'?",
    opts: ['Rarely', 'Never', 'Often', 'Slowly'],
    ans: 2,
  },
  {
    id: 6, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What is an antonym of 'generous'?",
    opts: ['Kind', 'Stingy', 'Brave', 'Smart'],
    ans: 1,
  },
  {
    id: 7, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What does 'accomplish' mean?",
    opts: ['To fail', 'To forget', 'To achieve', 'To hide'],
    ans: 2,
  },
  {
    id: 8, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What does 'remarkable' mean?",
    opts: ['Ordinary', 'Extraordinary', 'Boring', 'Quiet'],
    ans: 1,
  },
  {
    id: 9, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What is a synonym of 'intelligent'?",
    opts: ['Slow', 'Lazy', 'Clever', 'Loud'],
    ans: 2,
  },
  {
    id: 10, type: 'vocab', reward: 'bullet', diff: 1,
    text: "What does 'collaborate' mean?",
    opts: ['To compete', 'To argue', 'To work together', 'To ignore'],
    ans: 2,
  },
  {
    id: 11, type: 'vocab', reward: 'bullet', diff: 2,
    text: "What does 'transparent' mean?",
    opts: ['Very dark', 'See-through', 'Very heavy', 'Fragile'],
    ans: 1,
  },
  {
    id: 12, type: 'vocab', reward: 'bullet', diff: 2,
    text: "What does 'hesitate' mean?",
    opts: ['To rush', 'To celebrate', 'To pause before deciding', 'To understand'],
    ans: 2,
  },
  {
    id: 13, type: 'vocab', reward: 'bullet', diff: 2,
    text: "What does 'deceive' mean?",
    opts: ['To help', 'To mislead / trick', 'To discover', 'To forgive'],
    ans: 1,
  },
  {
    id: 14, type: 'vocab', reward: 'bullet', diff: 2,
    text: "What does 'persevere' mean?",
    opts: ['Give up easily', 'Move quickly', 'Keep trying despite difficulty', 'Speak loudly'],
    ans: 2,
  },
  {
    id: 15, type: 'vocab', reward: 'bullet', diff: 2,
    text: "What does 'humble' mean?",
    opts: ['Arrogant', 'Not proud / modest', 'Very rich', 'Very strong'],
    ans: 1,
  },
  {
    id: 16, type: 'vocab', reward: 'bullet', diff: 2,
    text: "What is a synonym of 'vivid'?",
    opts: ['Dull', 'Pale', 'Bright and clear', 'Silent'],
    ans: 2,
  },
  {
    id: 17, type: 'vocab', reward: 'double', diff: 2,
    text: "What does 'inevitable' mean?",
    opts: ['Possible to avoid', 'Unlikely to happen', 'Impossible to avoid', 'Very expensive'],
    ans: 2,
  },
  {
    id: 18, type: 'vocab', reward: 'double', diff: 2,
    text: "What does 'reluctant' mean?",
    opts: ['Very excited', 'Unwilling to do something', 'Extremely happy', 'Very tired'],
    ans: 1,
  },
  {
    id: 19, type: 'vocab', reward: 'double', diff: 2,
    text: "What is a synonym of 'catastrophe'?",
    opts: ['Celebration', 'Discovery', 'Disaster', 'Solution'],
    ans: 2,
  },
  {
    id: 20, type: 'vocab', reward: 'double', diff: 2,
    text: "What does 'simultaneous' mean?",
    opts: ['One at a time', 'Happening at the same time', 'Happening very slowly', 'Never happening'],
    ans: 1,
  },
  {
    id: 21, type: 'vocab', reward: 'double', diff: 3,
    text: "What does 'meticulous' mean?",
    opts: ['Very careless', 'Extremely detailed and careful', 'Very loud', 'Completely lost'],
    ans: 1,
  },
  {
    id: 22, type: 'vocab', reward: 'double', diff: 3,
    text: "What does 'eloquent' mean?",
    opts: ['Speaking poorly', 'Expressing ideas clearly and effectively', 'Being very shy', 'Thinking slowly'],
    ans: 1,
  },
  {
    id: 23, type: 'vocab', reward: 'double', diff: 3,
    text: "What is the meaning of 'ambiguous'?",
    opts: ['Very clear', 'Having two possible meanings', 'Extremely fast', 'Very kind'],
    ans: 1,
  },
  {
    id: 24, type: 'vocab', reward: 'double', diff: 3,
    text: "What does 'predominant' mean?",
    opts: ['Very rare', 'Most common or powerful', 'Very weak', 'Recently discovered'],
    ans: 1,
  },
  {
    id: 25, type: 'vocab', reward: 'double', diff: 3,
    text: "What is a synonym of 'substantial'?",
    opts: ['Tiny', 'Insignificant', 'Large and important', 'Temporary'],
    ans: 2,
  },

  // ── GRAMÁTICA ─────────────────────────────────────────────────────────────
  {
    id: 26, type: 'grammar', reward: 'bullet', diff: 1,
    text: "Choose the correct form:\n\"She ___ to school every day.\"",
    opts: ['go', 'going', 'goes', 'gone'],
    ans: 2,
  },
  {
    id: 27, type: 'grammar', reward: 'bullet', diff: 1,
    text: "Choose the correct past tense:\n\"They ___ a movie last night.\"",
    opts: ['watch', 'watches', 'watching', 'watched'],
    ans: 3,
  },
  {
    id: 28, type: 'grammar', reward: 'bullet', diff: 1,
    text: "Which sentence is grammatically CORRECT?",
    opts: ["He don't like pizza.", "He no like pizza.", "He doesn't like pizza.", "He not likes pizza."],
    ans: 2,
  },
  {
    id: 29, type: 'grammar', reward: 'bullet', diff: 1,
    text: "Choose the correct article:\n\"She wants to be ___ engineer.\"",
    opts: ['a', 'an', 'the', '—'],
    ans: 1,
  },
  {
    id: 30, type: 'grammar', reward: 'bullet', diff: 1,
    text: "Choose the correct preposition:\n\"She is good ___ math.\"",
    opts: ['in', 'on', 'at', 'for'],
    ans: 2,
  },
  {
    id: 31, type: 'grammar', reward: 'bullet', diff: 1,
    text: "Choose the correct plural:\none child → many ___",
    opts: ['childs', 'childrens', 'childes', 'children'],
    ans: 3,
  },
  {
    id: 32, type: 'grammar', reward: 'bullet', diff: 1,
    text: "What tense is:\n\"I will travel to Paris next week.\"",
    opts: ['Past simple', 'Present continuous', 'Future simple', 'Present perfect'],
    ans: 2,
  },
  {
    id: 33, type: 'grammar', reward: 'bullet', diff: 2,
    text: "Choose the correct tense:\n\"I ___ here for 3 years.\" (still here)",
    opts: ['live', 'lived', 'have lived', 'was living'],
    ans: 2,
  },
  {
    id: 34, type: 'grammar', reward: 'double', diff: 2,
    text: "Complete with the correct form:\n\"She ___ (study) for the exam right now.\"",
    opts: ['study', 'studies', 'is studying', 'was studying'],
    ans: 2,
  },
  {
    id: 35, type: 'grammar', reward: 'double', diff: 2,
    text: "Choose the correct conditional:\n\"If I ___ you, I would study harder.\"",
    opts: ['am', 'was', 'were', 'will be'],
    ans: 2,
  },
  {
    id: 36, type: 'grammar', reward: 'double', diff: 2,
    text: "Choose the correct gerund:\n\"They enjoy ___ in the park.\"",
    opts: ['walk', 'walks', 'to walk', 'walking'],
    ans: 3,
  },
  {
    id: 37, type: 'grammar', reward: 'double', diff: 2,
    text: "Choose the correct modal:\n\"I wish I ___ fly like a bird.\"",
    opts: ['can', 'could', 'would', 'should'],
    ans: 1,
  },
  {
    id: 38, type: 'grammar', reward: 'double', diff: 2,
    text: "Choose the passive voice:\n\"My mother baked the cake yesterday.\"",
    opts: ['The cake baked by my mother.', 'The cake was baked by my mother.', 'The cake has been baked by my mother.', 'The cake is baked by my mother.'],
    ans: 1,
  },
  {
    id: 39, type: 'grammar', reward: 'double', diff: 2,
    text: "Choose the correct preposition:\n\"We haven't seen them ___ last year.\"",
    opts: ['for', 'since', 'from', 'during'],
    ans: 1,
  },
  {
    id: 40, type: 'grammar', reward: 'double', diff: 2,
    text: "Choose the reported speech:\nShe said: \"I am happy.\" → She said that she ___.",
    opts: ['is happy', 'was happy', 'has been happy', 'will be happy'],
    ans: 1,
  },
  {
    id: 41, type: 'grammar', reward: 'double', diff: 2,
    text: "Complete the comparative:\n\"This book is ___ than that one.\"",
    opts: ['more interesting', 'most interesting', 'interestinger', 'more interest'],
    ans: 0,
  },
  {
    id: 42, type: 'grammar', reward: 'double', diff: 2,
    text: "Choose the correct subject-verb agreement:\n\"Neither John nor his friends ___ at the party.\"",
    opts: ['was', 'is', 'were', 'has been'],
    ans: 2,
  },
  {
    id: 43, type: 'grammar', reward: 'double', diff: 3,
    text: "\"By this time next year, she ___ her degree.\"",
    opts: ['will finish', 'finishes', 'will have finished', 'has finished'],
    ans: 2,
  },
  {
    id: 44, type: 'grammar', reward: 'double', diff: 3,
    text: "Choose the correct form:\n\"Despite ___ tired, she finished the race.\"",
    opts: ['be', 'to be', 'being', 'been'],
    ans: 2,
  },
  {
    id: 45, type: 'grammar', reward: 'double', diff: 3,
    text: "Choose the correlative conjunction:\n\"The more you practice, ___ you get.\"",
    opts: ['more good', 'the better', 'more better', 'the most good'],
    ans: 1,
  },
  {
    id: 46, type: 'grammar', reward: 'double', diff: 3,
    text: "\"He spoke so quietly that I ___ hear him.\"",
    opts: ['can\'t', 'couldn\'t', 'won\'t', 'wouldn\'t'],
    ans: 1,
  },
  {
    id: 47, type: 'grammar', reward: 'double', diff: 3,
    text: "\"Would you mind ___ the window?\"",
    opts: ['to close', 'close', 'closing', 'closed'],
    ans: 2,
  },
  {
    id: 48, type: 'grammar', reward: 'double', diff: 3,
    text: "Choose the inverted syntax:\n\"Not until I arrived ___\"",
    opts: ['he left.', 'he did leave.', 'did he leave.', 'had he leave.'],
    ans: 2,
  },

  // ── BONUS (dan granada o escudo) ─────────────────────────────────────────
  {
    id: 49, type: 'bonus', reward: 'grenade', diff: 3,
    text: "⚡ BONUS! Which sentence uses the\nsubjunctive mood correctly?",
    opts: ['I suggest that he studies harder.', 'I suggest that he study harder.', 'I suggest he to study harder.', 'I suggest him studying harder.'],
    ans: 1,
  },
  {
    id: 50, type: 'bonus', reward: 'grenade', diff: 3,
    text: "⚡ BONUS! Complete the idiom:\n\"It's raining ___!\"",
    opts: ['fish and chips', 'cats and dogs', 'dogs and birds', 'bread and butter'],
    ans: 1,
  },
  {
    id: 51, type: 'bonus', reward: 'shield', diff: 3,
    text: "⚡ BONUS! Choose the sentence with\nthe correct relative clause:",
    opts: ['The book that I read it was long.', 'The book which I read was long.', 'The book what I read was long.', 'The book I read it was long.'],
    ans: 1,
  },
  {
    id: 52, type: 'bonus', reward: 'grenade', diff: 3,
    text: "⚡ BONUS! He acted as though he ___\nthe answer all along.",
    opts: ['knows', 'know', 'would know', 'had known'],
    ans: 3,
  },
  {
    id: 53, type: 'bonus', reward: 'shield', diff: 3,
    text: "⚡ BONUS! Choose the formal alternative\nfor 'find out':",
    opts: ['look for', 'discover', 'check out', 'go over'],
    ans: 1,
  },
  {
    id: 54, type: 'bonus', reward: 'grenade', diff: 3,
    text: "⚡ BONUS! Which word means\n'to make something better'?",
    opts: ['deteriorate', 'maintain', 'enhance', 'reduce'],
    ans: 2,
  },
  {
    id: 55, type: 'bonus', reward: 'shield', diff: 3,
    text: "⚡ BONUS! Choose the correct phrase\n'It's the best film ___!'",
    opts: ["I have never seen", "I've ever seen", "I ever have seen", "I've never seen"],
    ans: 1,
  },
  {
    id: 56, type: 'bonus', reward: 'grenade', diff: 3,
    text: "⚡ BONUS! What does the prefix\n'mis-' mean in 'misunderstand'?",
    opts: ['again', 'before', 'wrongly', 'not at all'],
    ans: 2,
  },
  {
    id: 57, type: 'bonus', reward: 'shield', diff: 3,
    text: "⚡ BONUS! Choose the sentence with\ncorrect subject-verb agreement:",
    opts: ["Each of the students have a book.", "Each of the students has a book.", "Each of the students having a book.", "Each students has a book."],
    ans: 1,
  },
  {
    id: 58, type: 'bonus', reward: 'grenade', diff: 3,
    text: "⚡ BONUS! What does 'superfluous' mean?",
    opts: ['Essential', 'Unnecessary / excessive', 'Very fast', 'Underground'],
    ans: 1,
  },
  {
    id: 59, type: 'bonus', reward: 'shield', diff: 2,
    text: "⚡ BONUS! \"___ she was tired, she kept working.\"",
    opts: ['Despite', 'However', 'Although', 'Because'],
    ans: 2,
  },
  {
    id: 60, type: 'bonus', reward: 'grenade', diff: 3,
    text: "⚡ BONUS! What is the meaning\nof 'ubiquitous'?",
    opts: ['Very rare', 'Extremely old', 'Present everywhere', 'Very expensive'],
    ans: 2,
  },
];

// Pool separado por tipo
export const VOCAB_Q   = QUESTIONS.filter(q => q.type === 'vocab');
export const GRAMMAR_Q = QUESTIONS.filter(q => q.type === 'grammar');
export const BONUS_Q   = QUESTIONS.filter(q => q.type === 'bonus');

// Historial para no repetir preguntas seguidas
const used = new Set<number>();

export function getRandomQuestion(preferBonus = false): Question {
  const pool = preferBonus
    ? [...BONUS_Q]
    : [...VOCAB_Q, ...GRAMMAR_Q];

  const available = pool.filter(q => !used.has(q.id));
  const source = available.length > 0 ? available : pool;

  if (available.length === 0) used.clear();

  const q = source[Math.floor(Math.random() * source.length)];
  used.add(q.id);
  return q;
}

export function resetQuestionPool(): void {
  used.clear();
}
