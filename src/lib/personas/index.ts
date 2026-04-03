import { ARISTOTLE_SYSTEM_PROMPT } from '../aristotle-prompt';
import { JESUS_SYSTEM_PROMPT } from './jesus';
import { MARX_SYSTEM_PROMPT } from './marx';
import { PLATO_SYSTEM_PROMPT } from './plato';
import { ARISTOTLE_TOPICS } from './topics/aristotle-topics';
import { PLATO_TOPICS } from './topics/plato-topics';

export interface Topic {
  id: string;
  title: string;
  description: string;
  sourceText: string;
  teachingPrompt: string;
  examinationPrompt: string;
}

export interface Persona {
  id: string;
  name: string;
  years: string;
  description: string;
  signalStrength: 'ancient' | 'old' | 'modern';
  systemPrompt: string;
  openingContext: string;
  pactOptions: { title: string; description: string }[];
  preferredModel?: string;
  hidden?: boolean;
  topics?: Topic[];
}

export const PERSONAS: Record<string, Persona> = {
  aristotle: {
    id: 'aristotle',
    name: 'Aristotle',
    years: '384–322 BC',
    description: 'Philosopher, scientist, tutor to Alexander. Teaches through questions.',
    signalStrength: 'ancient',
    systemPrompt: ARISTOTLE_SYSTEM_PROMPT,
    openingContext: '[A new student approaches. They seek your guidance for this purpose: "${pact}". Acknowledge their purpose. Accept or challenge it. Then begin teaching.]',
    pactOptions: [
      { title: 'Understand my own mind', description: 'Consciousness, self-knowledge, the examined life. Know thyself.' },
      { title: 'Live more truthfully', description: 'Ethics, virtue, courage. How to act rightly in a complicated world.' },
      { title: 'Think more clearly', description: 'Logic, reasoning, argument. Sharpen how I process the world.' },
      { title: 'Find meaning and purpose', description: 'Eudaimonia, the good life, what makes a life worth living.' },
      { title: 'Understand others', description: 'Friendship, politics, persuasion. How humans work together and fail to.' },
    ],
    topics: ARISTOTLE_TOPICS,
  },
  jesus: {
    id: 'jesus',
    name: 'Jesus of Nazareth',
    years: 'c. 4 BC – 30 AD',
    description: 'Rabbi, teacher, carpenter\'s son. Speaks in parables. Meets you where you are.',
    signalStrength: 'ancient',
    systemPrompt: JESUS_SYSTEM_PROMPT,
    openingContext: '[Someone has come to you. They carry this in their heart: "${pact}". See them. Speak to what they truly need, not just what they ask.]',
    pactOptions: [
      { title: 'Find peace', description: 'I carry anxiety, guilt, or restlessness. I want to set it down.' },
      { title: 'Understand forgiveness', description: 'How to forgive others. How to forgive myself. What forgiveness even means.' },
      { title: 'Live with more love', description: 'I want to love better. My family, my enemies, myself.' },
      { title: 'Find purpose in suffering', description: 'Life is hard right now. I need to understand why, or how to endure.' },
      { title: 'Challenge my beliefs', description: 'I want to hear you speak for yourself, not through 2,000 years of interpretation.' },
    ],
  },
  marx: {
    id: 'marx',
    name: 'Karl Marx',
    years: '1818–1883',
    description: 'Philosopher, economist, revolutionary. Sees the system behind the system.',
    signalStrength: 'old',
    systemPrompt: MARX_SYSTEM_PROMPT,
    openingContext: '[Someone wishes to discuss ideas with you. Their interest: "${pact}". Engage them seriously. If their thinking is muddled, help them sharpen it. If it is sharp, sharpen it further.]',
    pactOptions: [
      { title: 'Understand capitalism', description: 'How the system actually works. Not the textbook version. The machinery underneath.' },
      { title: 'Understand power structures', description: 'Who benefits from the way things are? Why does the world stay the way it is?' },
      { title: 'Think about work differently', description: 'Why does my job feel meaningless? What is alienation and am I experiencing it?' },
      { title: 'Understand history', description: 'How did we get here? What forces shape societies? What comes next?' },
      { title: 'Argue with you', description: 'I think you were wrong. Convince me otherwise.' },
    ],
  },
  plato: {
    id: 'plato',
    name: 'Plato',
    years: 'c. 428–348 BC',
    description: 'Philosopher, founder of the Academy, student of Socrates. Dismantles what you think you know.',
    signalStrength: 'ancient',
    systemPrompt: PLATO_SYSTEM_PROMPT,
    openingContext: '[A new student approaches. They seek your guidance for this purpose: "${pact}". Consider their purpose. Accept it, reframe it, or challenge it. Then begin.]',
    pactOptions: [
      { title: 'Understand what is real', description: 'Appearance vs. reality, the Forms, the cave. What can I actually know?' },
      { title: 'Live more justly', description: 'What is justice? Is it worth pursuing even when no one is watching?' },
      { title: 'Examine my beliefs', description: 'I want someone to dismantle what I think I know and see what survives.' },
      { title: 'Understand love', description: 'Eros, beauty, desire. What am I really seeking when I seek another person?' },
      { title: 'Think about the ideal society', description: 'What would a truly just community look like? Who should lead and why?' },
    ],
    topics: PLATO_TOPICS,
  },
};

// Only show non-hidden personas in the selection screen
export const PERSONA_LIST = Object.values(PERSONAS).filter(p => !p.hidden);

export function getPersona(id: string): Persona {
  return PERSONAS[id] || PERSONAS.aristotle;
}
