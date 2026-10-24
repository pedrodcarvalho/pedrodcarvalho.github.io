import type { Localized } from '@/i18n';

export type SkillGroup = {
  id: string;
  title: Localized<string>;
  icon: 'brain' | 'chip' | 'code' | 'pipeline';
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'ai',
    title: { en: 'AI / ML', pt: 'IA / ML' },
    icon: 'brain',
    items: [
      'Python',
      'PyTorch',
      'TensorFlow / Keras',
      'TensorFlow Lite Micro',
      'scikit-learn',
      'OpenCV',
      'YOLO',
      'NumPy',
      'pandas',
      'CNNs',
      'NLP',
      'Reinforcement learning',
      'LLM APIs (Gemini)',
    ],
  },
  {
    id: 'embedded',
    title: { en: 'Embedded & V2X', pt: 'Embarcados e V2X' },
    icon: 'chip',
    items: [
      'C',
      'C++',
      'Embedded Linux',
      'Kernel modules',
      'ESP32',
      'CAN/OBD-II',
      'GNSS',
      'MQTT',
      'ROS 2',
      'C-V2X',
      'ETSI ITS',
    ],
  },
  {
    id: 'software',
    title: { en: 'Software', pt: 'Software' },
    icon: 'code',
    items: [
      'TypeScript',
      'JavaScript',
      'React',
      'Node.js',
      'Express',
      'Flask',
      'REST',
      'WebSockets',
      'MongoDB',
      'SQL',
      'Jest',
    ],
  },
  {
    id: 'devops',
    title: { en: 'DevOps & Tools', pt: 'DevOps e Ferramentas' },
    icon: 'pipeline',
    items: ['Git', 'GitHub Actions', 'Docker', 'CI/CD', 'Bash', 'Linux', 'Nginx', 'Wireshark'],
  },
];

export const spokenLanguages: Localized<{ name: string; level: string }[]> = {
  en: [
    { name: 'Portuguese', level: 'Native' },
    { name: 'English', level: 'Fluent' },
    { name: 'Spanish', level: 'Basic' },
    { name: 'German', level: 'Elementary' },
  ],
  pt: [
    { name: 'Português', level: 'Nativo' },
    { name: 'Inglês', level: 'Fluente' },
    { name: 'Espanhol', level: 'Básico' },
    { name: 'Alemão', level: 'Elementar' },
  ],
};
