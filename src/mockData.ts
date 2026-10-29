import { Culte, EventItem, NewsItem, AlbumItem, DepartmentItem, SiteImages, HeroContent } from './types';
import heroImg from './assets/images/church_hero_worship_1793042690258.jpg';
import pastorImg from './assets/images/pastor_sermon_pulpit_1793042690731.jpg';
import choirImg from './assets/images/church_choir_praise_1793042691389.jpg';
import youthImg from './assets/images/youth_fellowship_jadci_1793042690601.jpg';

export const HERO_IMAGE = heroImg;
export const PASTOR_IMAGE = pastorImg;
export const CHOIR_IMAGE = choirImg;
export const YOUTH_IMAGE = youthImg;

export const DEFAULT_SITE_IMAGES: SiteImages = {
  heroImage: HERO_IMAGE,
  pastorImage: PASTOR_IMAGE,
  choirImage: CHOIR_IMAGE,
  youthImage: YOUTH_IMAGE
};

export const DEFAULT_HERO_CONTENT: HeroContent = {
  nationalBadge: 'Église Évangélique des Assemblées de Dieu de Côte d’Ivoire',
  locationBadge: 'Anyama, Ran-Extension Résidentiel',
  mainTitle: 'Une église unie pour adorer Dieu, grandir dans la foi et impacter Anyama.',
  welcomeMessage: 'Bienvenue sur la plateforme officielle de l’Église Évangélique des Assemblées de Dieu d’Anyama, Ran-Extension Résidentiel. Retrouvez les résumés complets de nos cultes, les prédications, nos programmes et la vie des départements.',
  actionButtonCulte: 'Consulter le dernier culte',
  actionButtonEvents: 'Programmes & Événements'
};

export const INITIAL_CULTES: Culte[] = [
  {
    id: 'culte-2026-10-25',
    title: 'Demeurer inébranlable dans la foi et la persévérance',
    subtitle: 'Culte d’adoration et de louange du dimanche matin',
    date: '2026-10-25',
    time: '07h30 - 11h00',
    preacher: 'Pasteur Invité Dr. Emmanuel Kouassi',
    preacherRole: 'Pasteur Principal & Enseignant Biblique',
    moderator: 'Diacre Jean-Baptiste N’guessan',
    scriptureRef: 'Philippiens 4 : 4-9 & Hébreux 11 : 1-6',
    scripturePassage: '« Réjouissez-vous toujours dans le Seigneur; je le répète, réjouissez-vous. Que votre douceur soit connue de tous les hommes. Le Seigneur est proche. Ne vous inquiétez de rien... »',
    sermonSummary: 'Dans un contexte marqué par les défis de la vie quotidienne et les incertitudes, la parole de Dieu nous exhorte à fixer nos regards sur Christ. La véritable paix ne vient pas de l’absence de tempêtes, mais de la présence constante du Saint-Esprit au cœur de notre marche spirituelle.',
    keyPoints: [
      '1. La joie du croyant est un choix spirituel enraciné en Christ, et non dans les circonstances matérielles.',
      '2. La prière fervente accompagnée d’actions de grâces est l’antidote divin contre toute forme d’anxiété.',
      '3. Garder ses pensées pures et orientées vers ce qui est honorable et digne de louange.',
      '4. La persévérance dans l’assemblée des saints fortifie les âmes et bâtit l’amour fraternel à Anyama.'
    ],
    liturgy: [
      { time: '08h30', title: 'Accueil & Prière d’ouverture', leader: 'Équipe d’accueil & Modérateur', description: 'Invocation de la présence de Dieu et salutations fraternelles.' },
      { time: '08h50', title: 'Louange & Adoration vivante', leader: 'Chorale & Groupe Musical', description: 'Chants d’adoration et cantiques en français et langues locales.' },
      { time: '09h40', title: 'Dîmes, Offrandes & Annonces officielles', leader: 'Diaconat & Secrétariat', description: 'Présentation des communiqués de la semaine et bénédiction des offrandes.' },
      { time: '10h15', title: 'Prédication de la Parole de Dieu', leader: 'Pasteur Dr. Emmanuel Kouassi', description: 'Exposition textuelle et exhortation prophétique.' },
      { time: '11h15', title: 'Ministère de prière & Appel aux âmes', leader: 'Corps pastoral', description: 'Intercession pour les malades, les familles et bénédiction finale.' }
    ],
    coverImage: PASTOR_IMAGE,
    photos: [
      HERO_IMAGE,
      PASTOR_IMAGE,
      CHOIR_IMAGE,
      YOUTH_IMAGE
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // Placeholder format for demo player
    videoDuration: '1h 42m',
    hasVideo: true,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    audioDuration: '44:12',
    documents: [
      { title: 'Fiche d’étude biblique & Résumé du culte', fileSize: '420 Ko', type: 'pdf', downloadUrl: '#' },
      { title: 'Bulletin hebdomadaire des annonces (PDF)', fileSize: '1.2 Mo', type: 'pdf', downloadUrl: '#' },
      { title: 'Diapositives des versets projetés', fileSize: '2.8 Mo', type: 'diapo', downloadUrl: '#' }
    ],
    reactions: {
      likes: 84,
      hearts: 62,
      prayers: 119
    },
    comments: [
      {
        id: 'c1',
        targetId: 'culte-2026-10-25',
        targetType: 'culte',
        targetTitle: 'Demeurer inébranlable dans la foi et la persévérance',
        authorName: 'Frère Marc A.',
        text: 'Ce message sur Philippiens 4 m’a profondément relevé cette semaine. Gloire à Jésus pour notre église à Anyama !',
        date: 'Il y a 1 jour',
        status: 'auto-publie'
      },
      {
        id: 'c2',
        targetId: 'culte-2026-10-25',
        targetType: 'culte',
        targetTitle: 'Demeurer inébranlable dans la foi et la persévérance',
        authorName: 'Sœur Estelle K.',
        text: 'Un moment d’adoration particulièrement glorieux avec la chorale et le groupe musical. Merci pour le résumé.',
        date: 'Il y a 18 heures',
        status: 'auto-publie'
      }
    ],
    status: 'publie',
    isDemo: true
  },
  {
    id: 'culte-2026-10-18',
    title: 'La puissance de la prière d’intercession communautaire',
    subtitle: 'Culte d’action de grâces et de réveil spirituel',
    date: '2026-10-18',
    time: '18h30 - 20h00',
    preacher: 'Pasteur Samuel Yao',
    preacherRole: 'Pasteur Associé',
    moderator: 'Ancien David Bamba',
    scriptureRef: 'Actes 12 : 1-11 & 2 Chroniques 7 : 14',
    scripturePassage: '« Si mon peuple sur qui est invoqué mon nom s’humilie, prie, et cherche ma face... j’exaucerai des cieux, je lui pardonnerai son péché, et je guérirai son pays. »',
    sermonSummary: 'L’Église primitive triomphait de toutes les oppressions grâce à la prière unanime et assidue. Quand l’église d’Anyama prie, les chaînes de l’ennemi se brisent et les portes de fer s’ouvrent d’elles-mêmes.',
    keyPoints: [
      '1. L’intercession n’est pas réservée à une élite, elle est le souffle de chaque croyant.',
      '2. Dieu répond de façon surnaturelle quand son peuple se tient d’un même cœur.',
      '3. La délivrance de l’apôtre Pierre démontre que rien n’est impossible à la prière persévérante.'
    ],
    liturgy: [
      { time: '18h30', title: 'Prière d’entrée & Cantiques', leader: 'Service d’Adoration' },
      { time: '19h00', title: 'Moments d’adoration solennelle', leader: 'Groupe Musical' },
      { time: '19h20', title: 'Message de la Parole', leader: 'Pasteur Samuel Yao' },
      { time: '19h50', title: 'Intercession collective pour Anyama et la Côte d’Ivoire', leader: 'Comité de Prière' }
    ],
    coverImage: HERO_IMAGE,
    photos: [HERO_IMAGE, CHOIR_IMAGE],
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    videoDuration: '1h 35m',
    hasVideo: true,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    audioDuration: '38:50',
    documents: [
      { title: 'Guide de prière de la semaine (PDF)', fileSize: '350 Ko', type: 'pdf', downloadUrl: '#' }
    ],
    reactions: {
      likes: 67,
      hearts: 48,
      prayers: 95
    },
    comments: [
      {
        id: 'c3',
        targetId: 'culte-2026-10-18',
        targetType: 'culte',
        targetTitle: 'La puissance de la prière d’intercession communautaire',
        authorName: 'Maman Christine',
        text: 'Amen ! Que la grâce de Dieu repose continuellement sur nos pasteurs et sur toute la communauté.',
        date: 'Il y a 8 jours',
        status: 'auto-publie'
      }
    ],
    status: 'publie',
    isDemo: true
  },
  {
    id: 'culte-2026-10-11',
    title: 'Servir avec amour dans la maison de Dieu',
    subtitle: 'Culte de consécration des nouveaux ouvriers',
    date: '2026-10-11',
    time: '07h30 - 11h00',
    preacher: 'Pasteur Dr. Emmanuel Kouassi',
    preacherRole: 'Pasteur Principal',
    moderator: 'Diaconesse Marie-Laure S.',
    scriptureRef: '1 Corinthiens 12 : 4-12 & Romains 12 : 9-13',
    scripturePassage: '« Il y a diversité de dons, mais le même Esprit; diversité de ministères, mais le même Seigneur... »',
    sermonSummary: 'Chaque membre est un membre vivant du corps de Christ. Nos dons et nos talents doivent être mis au service de la communauté locale pour l’édification mutuelle et l’évangélisation.',
    keyPoints: [
      '1. Tous appelés à servir selon la mesure de grâce reçue.',
      '2. L’humilité et l’unité sont les sceaux du véritable serviteur.',
      '3. Valoriser chaque département et chaque groupe de travail.'
    ],
    liturgy: [
      { time: '07h30', title: 'Accueil & Louange', leader: 'Chorale d’Anyama' },
      { time: '09h15', title: 'Prédication', leader: 'Pasteur Dr. Emmanuel Kouassi' },
      { time: '10h30', title: 'Prière pour les départements', leader: 'Conseil des Anciens' }
    ],
    coverImage: CHOIR_IMAGE,
    photos: [CHOIR_IMAGE, YOUTH_IMAGE, HERO_IMAGE],
    videoDuration: '1h 50m',
    hasVideo: false,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    audioDuration: '52:10',
    documents: [
      { title: 'Fiche d’engagement des serviteurs', fileSize: '510 Ko', type: 'pdf', downloadUrl: '#' }
    ],
    reactions: {
      likes: 54,
      hearts: 39,
      prayers: 72
    },
    comments: [],
    status: 'publie',
    isDemo: true
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    title: 'Grande Nuit de Prière et de Traversée Spirituelle',
    category: 'Prière',
    date: 'Vendredi 30 Octobre 2026',
    time: '21h30 - 05h00 du matin',
    location: 'Grand Temple des Assemblées de Dieu, Anyama',
    description: 'Une nuit mémorable de louange prophétique, d’intercession pour la nation ivoirienne, pour les familles d’Anyama et de combat spirituel victorieux. Venez avec votre famille et vos proches.',
    speaker: 'Équipe pastorale & Orateurs invités',
    coverImage: HERO_IMAGE,
    attendeesCount: 312,
    isRegistered: false,
    likes: 58,
    comments: [
      {
        id: 'evc-1',
        targetId: 'ev-1',
        targetType: 'evenement',
        targetTitle: 'Grande Nuit de Prière et de Traversée Spirituelle',
        authorName: 'Frère David Y.',
        text: 'Présent par la grâce de Dieu ! Toute notre cellule de prière se mobilise pour cette nuit sainte.',
        date: 'Il y a 2 jours',
        status: 'auto-publie'
      }
    ],
    poll: {
      question: 'Serez-vous présent(e) à ce grand rassemblement de prière ?',
      options: [
        { id: 'yes', label: 'Oui, je serai présent(e) au temple', votes: 142 },
        { id: 'online', label: 'Je suivrai et prierai en communion à distance', votes: 47 },
        { id: 'no', label: 'Indisponible cette fois-ci', votes: 11 }
      ],
      totalVotes: 200
    },
    isDemo: true
  },
  {
    id: 'ev-2',
    title: 'Retraite Annuelle de la Jeunesse (JADCI Anyama)',
    category: 'Jeunesse',
    date: '14 - 16 Novembre 2026',
    time: 'Du vendredi 16h au dimanche 17h',
    location: 'Centre de Retraite Spirituelle & Camp Biblique',
    description: 'Thème : « Une jeunesse consacrée et impactante pour sa génération ». Au programme : enseignements bibliques, ateliers pratiques, leadership, louange et communion fraternelle.',
    speaker: 'Pasteur de Jeunesse & Leaders JADCI',
    coverImage: YOUTH_IMAGE,
    attendeesCount: 145,
    isRegistered: true,
    likes: 92,
    comments: [
      {
        id: 'evc-2',
        targetId: 'ev-2',
        targetType: 'evenement',
        targetTitle: 'Retraite Annuelle de la Jeunesse (JADCI Anyama)',
        authorName: 'Jeune Sarah',
        text: 'Hâte de vivre ce camp avec toute la JADCI Anyama ! Que Dieu nous renouvelle puissamment.',
        date: 'Il y a 4 jours',
        status: 'auto-publie'
      }
    ],
    poll: {
      question: 'Comptez-vous participer à la retraite annuelle de la jeunesse ?',
      options: [
        { id: 'yes', label: 'Oui, inscrit(e) et prêt(e) !', votes: 94 },
        { id: 'online', label: 'Je soutiens les jeunes par la prière', votes: 31 },
        { id: 'no', label: 'Empêché(e) par les études ou le travail', votes: 15 }
      ],
      totalVotes: 140
    },
    isDemo: true
  },
  {
    id: 'ev-3',
    title: 'Séminaire Spécial des Femmes d’Impact (MIFA)',
    category: 'Femmes',
    date: 'Samedi 21 Novembre 2026',
    time: '09h00 - 15h30',
    location: 'Salle polyvalente du Temple, Anyama',
    description: 'Journée d’édification, d’épanouissement spirituel et familial pour toutes les femmes et jeunes filles de l’église et de la commune d’Anyama.',
    speaker: 'Maman Pasteur & Invitée d’Honneur',
    coverImage: CHOIR_IMAGE,
    attendeesCount: 98,
    isRegistered: false,
    likes: 41,
    comments: [],
    poll: {
      question: 'Serez-vous présente au séminaire MIFA ?',
      options: [
        { id: 'yes', label: 'Oui, je serai présente dès 09h00', votes: 62 },
        { id: 'online', label: 'En union de prière avec les mamans', votes: 20 },
        { id: 'no', label: 'Absente pour cette session', votes: 8 }
      ],
      totalVotes: 90
    },
    isDemo: true
  },
  {
    id: 'ev-4',
    title: 'Campagne d’Évangélisation de Proximité dans les Quartiers d’Anyama',
    category: 'Évangélisation',
    date: '27 - 29 Novembre 2026',
    time: '18h00 - 21h00',
    location: 'Place publique / Quartiers d’Anyama',
    description: 'Proclamation de la Bonne Nouvelle de Jésus-Christ avec projection de film biblique, prières pour les malades et distribution de traités d’évangélisation.',
    speaker: 'Comité d’Évangélisation & Évangélistes locaux',
    coverImage: PASTOR_IMAGE,
    attendeesCount: 220,
    isRegistered: false,
    likes: 76,
    comments: [],
    poll: {
      question: 'Allez-vous participer à la moisson dans les quartiers ?',
      options: [
        { id: 'yes', label: 'Oui, je participerai activement', votes: 110 },
        { id: 'online', label: 'Je soutiendrai l’équipe en prière', votes: 45 },
        { id: 'no', label: 'Indisponible', votes: 9 }
      ],
      totalVotes: 164
    },
    isDemo: true
  }
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Communiqué Pastoral : Programme spécial de prière pour la fin d’année',
    category: 'Communiqué officiel',
    date: '24 Octobre 2026',
    author: 'Secrétariat Général de l’Église',
    authorRole: 'Bureau du Conseil Pastoral',
    summary: 'Le Conseil Pastoral informe les fidèles du démarrage du cycle d’intercession matinal « 30 jours à genoux pour nos familles » à partir du 1er novembre.',
    fullContent: 'Chers frères et sœurs en Christ, la direction spirituelle de notre église locale d’Anyama invite l’ensemble de la communauté à se mobiliser dans la prière matinale (de 06h00 à 07h00 du lundi au vendredi). Des fiches de prière seront remises à la sortie des cultes et mises à disposition en téléchargement sur cette plateforme officielle de communication.',
    coverImage: HERO_IMAGE,
    isUrgent: true,
    readsCount: 428,
    likes: 64,
    comments: [
      {
        id: 'nc-1',
        targetId: 'news-1',
        targetType: 'actualite',
        targetTitle: 'Programme spécial de prière pour la fin d’année',
        authorName: 'Diacre Kouadio',
        text: 'Programme reçu et partagé dans toute la zone résidentielle. Que l’Éternel étende sa main sur nos familles.',
        date: 'Il y a 3 jours',
        status: 'auto-publie'
      }
    ],
    isDemo: true
  },
  {
    id: 'news-2',
    title: 'Rentrée des Classes et Soutien Scolaire avec l’ECODIM',
    category: 'Vie de l’église',
    date: '19 Octobre 2026',
    author: 'Direction de l’ECODIM',
    authorRole: 'Moniteurs de l’École du Dimanche',
    summary: 'Bilan de la rentrée des enfants à l’école du dimanche et appel aux parents pour les inscriptions aux ateliers bibliques et d’éveil.',
    fullContent: 'Plus de 180 enfants ont été accueillis avec joie dimanche dernier par l’équipe dévouée de l’ECODIM. Les moniteurs rappellent aux parents de veiller à munir leurs enfants d’une Bible adaptée et d’un cahier de notes pour un apprentissage régulier de la Parole.',
    coverImage: YOUTH_IMAGE,
    isUrgent: false,
    readsCount: 295,
    likes: 38,
    comments: [],
    isDemo: true
  },
  {
    id: 'news-3',
    title: 'Inscriptions ouvertes pour les Baptêmes d’eau par immersion',
    category: 'Communiqué officiel',
    date: '12 Octobre 2026',
    author: 'Commission des Baptêmes',
    authorRole: 'Diaconat & Enseignement',
    summary: 'Les cours de formation pour les candidats au saint baptême ont débuté les samedis matins à 08h00.',
    fullContent: 'Toute personne ayant accepté Jésus-Christ comme Seigneur et Sauveur personnel et désirant sceller son engagement par les eaux du baptême est priée de se faire enregistrer auprès du secrétariat ou en ligne.',
    coverImage: PASTOR_IMAGE,
    isUrgent: false,
    readsCount: 362,
    likes: 51,
    comments: [],
    isDemo: true
  }
];

export const INITIAL_ALBUMS: AlbumItem[] = [
  {
    id: 'alb-1',
    title: 'Culte d’Action de Grâces et Louange Glorieuse',
    category: 'Cultes',
    type: 'mixte',
    date: 'Dimanche 25 Octobre 2026',
    coverImage: HERO_IMAGE,
    mediaCount: 24,
    description: 'Moments forts capturés durant le grand culte dominical avec les fidèles, les chants de la chorale et la prédication du Pasteur.',
    isDemo: true,
    items: [
      { id: 'm1', type: 'photo', url: HERO_IMAGE, caption: 'L’assemblée réunie d’un même cœur dans l’adoration' },
      { id: 'm2', type: 'photo', url: PASTOR_IMAGE, caption: 'Proclamation de la parole de Dieu depuis la chaire' },
      { id: 'm3', type: 'photo', url: CHOIR_IMAGE, caption: 'La chorale unie dans la louange en tenue d’apparat' },
      { id: 'm4', type: 'video', url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', caption: 'Extrait vidéo de la louange dominicale (Anyama)', duration: '14:20' }
    ]
  },
  {
    id: 'alb-2',
    title: 'Rassemblement Fraternel de la Jeunesse (JADCI)',
    category: 'Jeunesse',
    type: 'photo',
    date: 'Samedi 17 Octobre 2026',
    coverImage: YOUTH_IMAGE,
    mediaCount: 18,
    description: 'Journée d’étude biblique et de fellowship des jeunes chrétiens d’Anyama dans la cour du temple.',
    isDemo: true,
    items: [
      { id: 'm5', type: 'photo', url: YOUTH_IMAGE, caption: 'Partage biblique en petits groupes et communion fraternelle' }
    ]
  },
  {
    id: 'alb-3',
    title: 'Prestation du Groupe Musical et de la Chorale',
    category: 'Chorale & Louange',
    type: 'video',
    date: 'Dimanche 11 Octobre 2026',
    coverImage: CHOIR_IMAGE,
    mediaCount: 8,
    description: 'Enregistrements vidéo des cantiques de louange et des chants traditionnels d’édification.',
    isDemo: true,
    items: [
      { id: 'm6', type: 'video', url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', caption: 'Cantique d’adoration « Jésus est digne » chanté par la chorale', duration: '08:45' }
    ]
  }
];

export const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  {
    id: 'jadci',
    code: 'JADCI',
    name: 'JADCI / Jeunesse d’Anyama',
    isNameConfirmed: false,
    tagline: 'Dynamique, foi vivante et consécration pour la jeunesse',
    description: 'La Jeunesse des Assemblées de Dieu de Côte d’Ivoire (section Anyama) rassemble les adolescents, élèves, étudiants et jeunes travailleurs pour grandir spirituellement et impacter leur environnement.',
    leader: 'Frère K. Stéphane (Président Jeunesse)',
    leaderRole: 'Bureau Exécutif Jeunesse',
    meetingSchedule: 'Tous les samedis de 16h00 à 18h30',
    meetingLocation: 'Salle des jeunes & Cour du Temple',
    activities: [
      'Études bibliques interactives & partages thématiques',
      'Ateliers d’orientation scolaire, professionnelle et entrepreneuriat',
      'Évangélisation dynamique par la jeunesse dans les quartiers',
      'Sorties spirituelles, camps bibliques et tournois de fraternité'
    ],
    coverImage: YOUTH_IMAGE,
    galleryImages: [YOUTH_IMAGE, HERO_IMAGE],
    contactPhone: '+225 07 00 00 01'
  },
  {
    id: 'mifa',
    code: 'MIFA',
    name: 'MIFA (Ministère des Femmes)',
    isNameConfirmed: true,
    tagline: 'Prière, foi agissante, soutien familial et entraide',
    description: 'Le Ministère des Femmes des Assemblées de Dieu regroupe toutes les femmes de l’église pour être des piliers de prière dans leurs foyers, soutenir l’œuvre de Dieu et pratiquer l’amour du prochain.',
    leader: 'Maman Diaconesse A. Patricia',
    leaderRole: 'Présidente MIFA Anyama',
    meetingSchedule: 'Chaque mardi de 15h30 à 17h30',
    meetingLocation: 'Grand Temple',
    activities: [
      'Intercession fervente pour les foyers, les enfants et la nation',
      'Séminaires sur la gestion du foyer chrétien et l’autonomisation',
      'Assistance sociale aux veuves, orphelins et personnes vulnérables',
      'Journées annuelles de célébration et d’action de grâces'
    ],
    coverImage: CHOIR_IMAGE,
    galleryImages: [CHOIR_IMAGE, HERO_IMAGE],
    contactPhone: '+225 07 00 00 02'
  },
  {
    id: 'ecodim',
    code: 'ECODIM',
    name: 'ECODIM (École du Dimanche)',
    isNameConfirmed: true,
    tagline: 'Instruire l’enfant selon la voie qu’il doit suivre',
    description: 'L’École du Dimanche prend en charge la formation spirituelle et morale des enfants de 3 à 14 ans, répartis en classes d’âge avec un corps dévoué de moniteurs formés.',
    leader: 'Sœur Monique B. (Responsable Pédagogique)',
    leaderRole: 'Coordinatrice ECODIM',
    meetingSchedule: 'Tous les dimanches pendant le culte (08h45 - 11h15)',
    meetingLocation: 'Bâtiment annexe des enfants',
    activities: [
      'Leçons bibliques adaptées et mémorisation de versets',
      'Chants chrétiens pour enfants, mimes et jeux éducatifs',
      'Fête de la Nativité, sketchs et récitations bibliques',
      'Journée annuelle des enfants et baptême des adolescents'
    ],
    coverImage: YOUTH_IMAGE,
    galleryImages: [YOUTH_IMAGE],
    contactPhone: '+225 07 00 00 03'
  },
  {
    id: 'groupe-musical',
    code: 'GM',
    name: 'Groupe Musical',
    isNameConfirmed: true,
    tagline: 'Conduire le peuple de Dieu au cœur de la louange',
    description: 'Composé de musiciens (pianistes, bassistes, batteurs, guitaristes) et de chantres, le Groupe Musical soutient les moments de louange et d’adoration lors de tous les cultes et programmes spéciaux.',
    leader: 'Frère David K. (Directeur Musical)',
    leaderRole: 'Conducteur de Louange',
    meetingSchedule: 'Répétitions les mercredis (18h30) et vendredis (18h00)',
    meetingLocation: 'Estrade du Temple',
    activities: [
      'Direction de la louange dominicale et des veillées de prière',
      'Formation continue aux instruments de musique pour les jeunes',
      'Création et harmonisation de cantiques de louange spirituels'
    ],
    coverImage: CHOIR_IMAGE,
    galleryImages: [CHOIR_IMAGE, HERO_IMAGE]
  },
  {
    id: 'hac',
    code: 'HAC',
    name: 'HAC (Hommes d’Action Chrétienne)',
    isNameConfirmed: true,
    tagline: 'Hommes de foi, intègres et engagés au service du Seigneur',
    description: 'Le groupe des Hommes d’Action Chrétienne fortifie les hommes dans leur responsabilité de chefs de famille spirituels, soutient les chantiers de l’église et anime la communion fraternelle.',
    leader: 'Ancien Joseph N.',
    leaderRole: 'Président HAC',
    meetingSchedule: 'Un samedi sur deux à 07h00 du matin',
    meetingLocation: 'Salle de réunion du Conseil',
    activities: [
      'Petits déjeuners de prière et d’exhortation entre hommes',
      'Travaux communautaires, entretien et soutien matériel de l’église',
      'Mentorat des jeunes garçons et nouveaux convertis'
    ],
    coverImage: PASTOR_IMAGE,
    galleryImages: [PASTOR_IMAGE, HERO_IMAGE]
  },
  {
    id: 'chorale',
    code: 'CHORALE',
    name: 'Chorale de l’Église',
    isNameConfirmed: true,
    tagline: 'Chanter pour la gloire de l’Éternel d’un accord parfait',
    description: 'La Chorale interprète le répertoire classique, les cantiques méthodiques et les chants traditionnels à quatre voix, apportant une profondeur spirituelle et solennelle aux célébrations.',
    leader: 'Maître de Chœur Théophile D.',
    leaderRole: 'Chef de Chœur',
    meetingSchedule: 'Jeudis et samedis de 18h00 à 20h00',
    meetingLocation: 'Sanctuaire',
    activities: [
      'Prestations chorales dominicales et lors des mariages',
      'Concerts spirituels annuels de Pâques et de fin d’année',
      'Apprentissage du solfège et de la technique vocale'
    ],
    coverImage: CHOIR_IMAGE,
    galleryImages: [CHOIR_IMAGE]
  },
  {
    id: 'evangelisation',
    code: 'EVANG',
    name: 'Comité d’Évangélisation',
    isNameConfirmed: true,
    tagline: 'Allez et faites de toutes les nations des disciples',
    description: 'Ce département a la charge de propager l’Évangile dans toute la ville d’Anyama et ses villages environnants par le porte-à-porte, les campagnes de plein air et les distributions de traités.',
    leader: 'Évangéliste Paul T.',
    leaderRole: 'Responsable Évangélisation',
    meetingSchedule: 'Samedis après-midi à 15h00',
    meetingLocation: 'Parvis du Temple',
    activities: [
      'Sorties d’évangélisation en binômes dans les quartiers d’Anyama',
      'Suivi et affermissement des nouvelles âmes et convertis',
      'Organisation des projections de films chrétiens en plein air'
    ],
    coverImage: HERO_IMAGE,
    galleryImages: [HERO_IMAGE, YOUTH_IMAGE]
  },
  {
    id: 'service-adoration',
    code: 'SA',
    name: 'Service d’Adoration',
    isNameConfirmed: true,
    tagline: 'Adorer le Père en esprit et en vérité',
    description: 'Structure dédiée à l’élévation spirituelle par la prière contemplative, l’accueil solennel de la présence divine et la coordination spirituelle des cultes.',
    leader: 'Sœur Anne-Marie G.',
    leaderRole: 'Responsable Liturgie & Adoration',
    meetingSchedule: 'Dimanches dès 07h30 pour la prière des sacrificateurs',
    meetingLocation: 'Salle de prière',
    activities: [
      'Intercession silencieuse et préparation de l’atmosphère spirituelle',
      'Coordination de la méditation liturgique avant chaque prédication'
    ],
    coverImage: HERO_IMAGE,
    galleryImages: [HERO_IMAGE]
  },
  {
    id: 'adoration-gestuelle',
    code: 'AG',
    name: 'Adoration Gestuelle',
    isNameConfirmed: true,
    tagline: 'Louer le Seigneur par le mouvement sacré et l’expression corporelle',
    description: 'Groupe d’adoration par la danse chrétienne, les bannières et l’expression gestuelle pour magnifier le Seigneur lors des grandes solennités et célébrations festives.',
    leader: 'Sœur Grâce-Emmanuelle',
    leaderRole: 'Chorégraphe & Responsable',
    meetingSchedule: 'Samedis de 14h00 à 16h00',
    meetingLocation: 'Salle Polyvalente',
    activities: [
      'Chorégraphies bibliques et danses de célébration',
      'Ministère par les bannières et drapeaux de louange',
      'Prestations lors des cultes festifs et conférences'
    ],
    coverImage: CHOIR_IMAGE,
    galleryImages: [CHOIR_IMAGE]
  },
  {
    id: 'pnpr',
    code: 'PNPR',
    name: 'PNPR (Prière, Nuit de Prière et Réveil)',
    isNameConfirmed: true,
    tagline: 'Sentinelles sur les murailles d’Anyama',
    description: 'Département stratégique regroupant les sentinelles d’intercession pour veiller dans la prière de nuit, soutenir spirituellement le corps pastoral et intercéder pour le réveil d’Anyama.',
    leader: 'Frère Eliezer K.',
    leaderRole: 'Coordinateur des Veillées',
    meetingSchedule: 'Dernier vendredi du mois (21h30 - 05h00)',
    meetingLocation: 'Sanctuaire',
    activities: [
      'Organisation des veillées mensuelles de combat et de délivrance',
      'Chaîne de prière continue 24h/24 par rotation',
      'Jeûnes collectifs pour la protection spirituelle de l’église'
    ],
    coverImage: HERO_IMAGE,
    galleryImages: [HERO_IMAGE, PASTOR_IMAGE]
  },
  {
    id: 'groupe-local-nouveau',
    code: 'GL-A-PRECISER',
    name: 'Groupe Local (Nom exact à préciser)',
    isNameConfirmed: false,
    tagline: 'Structure locale en cours de formalisation par le Conseil',
    description: 'Cette fiche est réservée à la structure paroissiale locale complémentaire dont l’appellation officielle exacte sera confirmée par l’équipe de communication et le Conseil Pastoral.',
    leader: 'Responsable désigné en attente',
    leaderRole: 'Coordination Provisoire',
    meetingSchedule: 'Créneau en cours de définition',
    meetingLocation: 'Temple Anyama',
    activities: [
      'Activités en cours de planification',
      'Validation pastorale préalable requise'
    ],
    coverImage: PASTOR_IMAGE,
    galleryImages: [PASTOR_IMAGE]
  }
];

export const CHURCH_INFO = {
  denomination: 'Église Évangélique des Assemblées de Dieu de Côte d’Ivoire (EEADCI)',
  parishName: 'Anyama, Ran-Extension Résidentiel',
  city: 'Anyama, District Autonome d’Abidjan, Côte d’Ivoire',
  address: 'Quartier Ran Extension Résidentiel, Anyama',
  phone: '+225 27 00 00 00 / +225 07 00 00 00',
  email: 'communication@ad-anyama.ci',
  schedules: [
    { day: 'Mardi', name: 'Évangélisation et prière pour les malades', time: '18 h 30 à 20 h 00' },
    { day: 'Jeudi', name: 'Édification', time: '18 h 30 à 20 h 00' },
    { day: 'Dimanche', name: 'Culte de louange et d’adoration à l’Éternel', time: '7 h 30 à 11 h 00' }
  ]
};
