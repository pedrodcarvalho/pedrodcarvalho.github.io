import type { Localized } from '@/i18n';

/** Node ids of the V2X architecture diagram (see components/V2XDiagram.astro). */
export type DiagramNode =
  | 'can'
  | 'gnss'
  | 'obu-lead'
  | 'obu-follow'
  | 'link'
  | 'rsu'
  | 'camera'
  | 'signal'
  | 'dashboard'
  | 'mqtt'
  | 'netem'
  | 'ci'
  | 'robot';

export type Highlight = {
  id: string;
  title: Localized<string>;
  body: Localized<string>;
  tags: string[];
  /** Diagram nodes lit up when this highlight is hovered/focused. */
  nodes: DiagramNode[];
};

export type Role = {
  company: string;
  companyUrl: string;
  title: Localized<string>;
  context: Localized<string>;
  location: string;
  start: string; // ISO yyyy-mm
  end: string | null;
  period: Localized<string>;
  highlights: Highlight[];
};

export const experience: Role[] = [
  {
    company: 'Instituto de Pesquisas Eldorado',
    companyUrl: 'https://www.eldorado.org.br/',
    title: {
      en: 'Software Engineer Intern',
      pt: 'Estagiário em Desenvolvimento de Software',
    },
    context: {
      en: 'One of Brazil’s largest technology R&D institutes · Connected-vehicle (V2X) lab',
      pt: 'Um dos maiores institutos de P&D em tecnologia do Brasil · Laboratório de veículos conectados (V2X)',
    },
    location: 'Campinas, SP',
    start: '2025-01',
    end: null,
    period: { en: 'Jan 2025 – Present', pt: 'jan 2025 – atual' },
    highlights: [
      {
        id: 'cacc',
        title: {
          en: 'CACC prototype for a global automaker',
          pt: 'Protótipo de CACC para montadora global',
        },
        body: {
          en: 'Delivered a Cooperative Adaptive Cruise Control communication prototype for one of the world’s largest automakers: real-time data exchange between two vehicles through their on-board units, reaching 900+ m. Demoed live to the automaker’s senior executives.',
          pt: 'Entreguei um protótipo de comunicação para CACC (Controle de Cruzeiro Adaptativo Cooperativo) para uma das maiores montadoras do mundo: troca de dados em tempo real entre 2 veículos por meio de suas unidades embarcadas, alcançando mais de 900 m. Demonstrado ao vivo à alta liderança da montadora.',
        },
        tags: ['C-V2X', 'OBU', '900+ m'],
        nodes: ['obu-lead', 'obu-follow', 'link'],
      },
      {
        id: 'embedded',
        title: { en: 'Embedded C/C++ on C-V2X units', pt: 'C/C++ embarcado em unidades C-V2X' },
        body: {
          en: 'Wrote embedded C/C++ for Linux-based C-V2X units: read speed and brake state from CAN/OBD-II, fused it with GNSS, and broadcast ETSI Cooperative Awareness Messages tracking leader/follower state in real time.',
          pt: 'Desenvolvi C/C++ embarcado para unidades C-V2X em Linux: velocidade e freio via CAN/OBD-II e posição GNSS alimentam mensagens ETSI CAM que acompanham o estado dos veículos líder e seguidor em tempo real.',
        },
        tags: ['C/C++', 'CAN/OBD-II', 'GNSS', 'ETSI CAM'],
        nodes: ['can', 'gnss', 'obu-lead', 'obu-follow'],
      },
      {
        id: 'rsu',
        title: {
          en: 'Roadside unit with computer vision',
          pt: 'Unidade de beira de via com visão computacional',
        },
        body: {
          en: 'Built the roadside unit (RSU) service in Python that generates traffic-signal messages (SPaT/MAP) and runs OpenCV + YOLO pedestrian detection, groundwork for future AI-driven traffic lights in cities.',
          pt: 'Construí em Python o serviço da RSU (unidade de beira de via) que gera mensagens semafóricas (SPaT/MAP) e detecta pedestres com OpenCV + YOLO, base para futuros semáforos inteligentes com IA nas cidades.',
        },
        tags: ['Python', 'OpenCV', 'YOLO', 'SPaT/MAP'],
        nodes: ['rsu', 'camera', 'signal'],
      },
      {
        id: 'tooling',
        title: { en: 'The team’s test tooling', pt: 'Ferramentas de teste da equipe' },
        body: {
          en: 'Built a Flask + React/TypeScript control dashboard, an MQTT traffic simulator mixing virtual and real vehicles, and Linux network-emulation tooling that reproduces real-world latency and jitter on V2X links.',
          pt: 'Criei um dashboard de controle em Flask + React/TypeScript, um simulador de tráfego MQTT com veículos reais e virtuais, e ferramentas de emulação de rede em Linux que reproduzem latência e instabilidade reais nos enlaces V2X.',
        },
        tags: ['Flask', 'React', 'TypeScript', 'MQTT', 'netem'],
        nodes: ['dashboard', 'mqtt', 'netem'],
      },
      {
        id: 'devops',
        title: { en: 'Agile delivery & CI/CD', pt: 'Entrega ágil e CI/CD' },
        body: {
          en: 'Work in Scrum sprints with Git/GitHub code review, Docker, CI/CD pipelines and Bash scripting to cross-compile, deploy and test builds on OBUs and RSUs.',
          pt: 'Atuo em sprints Scrum com Git/GitHub e code review, Docker, pipelines de CI/CD e scripts Bash para compilar, implantar e testar builds nas OBUs e RSUs.',
        },
        tags: ['Scrum', 'Docker', 'CI/CD', 'Bash'],
        nodes: ['ci', 'obu-lead', 'obu-follow', 'rsu'],
      },
      {
        id: 'ros',
        title: { en: 'ROS 2 haptic teleoperation', pt: 'Teleoperação háptica com ROS 2' },
        body: {
          en: 'Developed ROS 2 nodes to teleoperate a 6-axis robotic arm with a haptic device (force feedback, joint limits, smoothing), monitored via Grafana/Zabbix.',
          pt: 'Desenvolvi nós ROS 2 para teleoperar um braço robótico de 6 eixos com dispositivo háptico (retorno de força, limites de junta, suavização), monitorados via Grafana/Zabbix.',
        },
        tags: ['ROS 2', 'C++', 'Grafana'],
        nodes: ['robot'],
      },
    ],
  },
];
