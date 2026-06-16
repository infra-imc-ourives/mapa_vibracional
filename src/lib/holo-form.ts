export type FormData = {
  // Dados pessoais
  nome: string;
  email: string;
  sexo: string;

  // Bloco 1 - Perfil Vibracional
  emocaoDominante: string;
  emocaoDominanteOutro: string;
  relacaoDinheiro: string;
  relacaoDinheiroOutro: string;
  pilarBloqueado: string[];
  pilarBloqueadoOutro: string;
  padraoBotagem: string;
  padraoBotaoOutro: string;
  fraseNaoMereco: string;
  historicoPessoal: string;
  historicoPessoalOutro: string;
  mudancaPrioritaria: string;

  // Bloco 2 - Raízes Ancestrais
  relacaoPaisDinheiro: string;
  relacaoPaisDinheiroOutro: string;
  fraseInfancia: string;
  sentimentoInfancia: string;
  sentimentoInfanciaOutro: string;
  padraoRepetido: string;
  padraoRepetidoNivel: string;
  padraoRepetidoNivelOutro: string;
  demonstracaoAfeto: string;
  demonstracaoAfetoOutro: string;
  traumaInfancia: string;
  traumaDescricao: string;
  mensagemAncestral: string;

  // Bloco 3 - Os 5 Vírus Emocionais
  escoreAbandono: string;
  escoreRejeicao: string;
  escoreInferioridade: string;
  escoreNegacaoAbundancia: string;
  escoreAusenciaAfetiva: string;
  situacaoRecente: string;
  padraoNaoConsegue: string;

  // Bloco 4 - Corpo e Frequência Atual
  tensaoCorpo: string[];
  tensaoCorpoOutro: string;
  padraoDormindo: string;
  padraoDormindoOutro: string;
  nivelEnergia: string;
  nivelEnergiaOutro: string;
  saudeRecorrente: string;
  relacaoComida: string;
  relacaoComidaOutro: string;
  escoreBloqueioSomatico: string;
  palavraCorpo: string;

  // Bloco 5 - Sonhos e Intenção de Cocriação
  maiorSonho: string;
  bloqueioSonho: string[];
  bloqueioSonhoOutro: string;
  prazSonho: string;
  prazSonhoOutro: string;
  escoreComprometimento: string;
  sinalSucesso: string;
  frenteTrabalho: string;
  frenteTrabalhoOutro: string;
  transformacao: string;
};

export const initialFormData: FormData = {
  nome: "",
  email: "",
  sexo: "",
  emocaoDominante: "",
  emocaoDominanteOutro: "",
  relacaoDinheiro: "",
  relacaoDinheiroOutro: "",
  pilarBloqueado: [],
  pilarBloqueadoOutro: "",
  padraoBotagem: "",
  padraoBotaoOutro: "",
  fraseNaoMereco: "",
  historicoPessoal: "",
  historicoPessoalOutro: "",
  mudancaPrioritaria: "",
  relacaoPaisDinheiro: "",
  relacaoPaisDinheiroOutro: "",
  fraseInfancia: "",
  sentimentoInfancia: "",
  sentimentoInfanciaOutro: "",
  padraoRepetido: "",
  padraoRepetidoNivel: "",
  padraoRepetidoNivelOutro: "",
  demonstracaoAfeto: "",
  demonstracaoAfetoOutro: "",
  traumaInfancia: "",
  traumaDescricao: "",
  mensagemAncestral: "",
  escoreAbandono: "",
  escoreRejeicao: "",
  escoreInferioridade: "",
  escoreNegacaoAbundancia: "",
  escoreAusenciaAfetiva: "",
  situacaoRecente: "",
  padraoNaoConsegue: "",
  tensaoCorpo: [],
  tensaoCorpoOutro: "",
  padraoDormindo: "",
  padraoDormindoOutro: "",
  nivelEnergia: "",
  nivelEnergiaOutro: "",
  saudeRecorrente: "",
  relacaoComida: "",
  relacaoComidaOutro: "",
  escoreBloqueioSomatico: "",
  palavraCorpo: "",
  maiorSonho: "",
  bloqueioSonho: [],
  bloqueioSonhoOutro: "",
  prazSonho: "",
  prazSonhoOutro: "",
  escoreComprometimento: "",
  sinalSucesso: "",
  frenteTrabalho: "",
  frenteTrabalhoOutro: "",
  transformacao: "",
};

// Dados pessoais
export const sexoOpts = [
  "Feminino",
  "Masculino",
  "Prefiro não informar",
];

// Bloco 1
export const emocaoDominanteOpts = [
  "Ansiedade",
  "Tristeza",
  "Raiva",
  "Medo",
  "Culpa",
  "Indiferença",
  "Esperança",
  "Contentamento",
  "Alegria",
  "Amor",
  "Outro",
];

export const relacaoDinheiroOpts = [
  "Nunca chega ou vai embora rápido",
  "Tenho mas nunca é suficiente",
  "Oscila muito (altos e baixos)",
  "Fluindo com equilíbrio",
  "Não tenho relação clara com ele",
  "Outro",
];

export const pilarBloqueadoOpts = [
  "Dinheiro / Finanças",
  "Amor / Relacionamento",
  "Saúde / Corpo",
  "Família",
  "Propósito / Carreira",
  "Autoestima",
  "Espiritualidade",
  "Outro",
];

export const padraoBotaoOpts = [
  "Algo externo sempre atrapalha",
  "Eu mesmo(a) me saboto",
  "Surge um problema inesperado",
  "Perco o interesse ou a energia",
  "Geralmente consigo concluir",
  "Outro",
];

export const historicoPessoalOpts = [
  "Sim, vários (mais de 3)",
  "Sim, alguns (1 a 3)",
  "Poucos (tentativas rápidas)",
  "Não, esta é minha primeira vez",
  "Outro",
];

// Bloco 2
export const relacaoPaisDinheiroOpts = [
  "Escassez e dívida constante",
  "Instável (altos e baixos)",
  "Suficiente mas nunca abundante",
  "Abundante e fluindo",
  "Não tive essa referência",
  "Outro",
];

export const sentimentoInfanciaOpts = [
  "Amado(a) e seguro(a)",
  "Ignorado(a) / invisível",
  "Sobrecarregado(a) de responsabilidade",
  "Rejeitado(a) ou excluído(a)",
  "Controlado(a) em excesso",
  "Confuso(a) / ambiente instável",
  "Abandonado(a)",
  "Outro",
];

export const padraoRepetidoNivelOpts = [
  "Tenho plena consciência desse padrão",
  "Suspeito que existe mas não tenho certeza",
  "Nunca pensei nisso",
  "Tenho certeza que não existe",
  "Outro",
];

export const demonstracaoAfetoOpts = [
  "Muito amorosa e expressiva",
  "Fria e distante",
  "Sufocante / controladora",
  "Instável (às vezes amorosa, às vezes ausente)",
  "Ausente ou inexistente",
  "Outro",
];

export const traumaInfanciaOpts = ["Sim", "Não"];

// Bloco 4
export const tensaoCorpoOpts = [
  "Cabeça",
  "Pescoço / Garganta",
  "Ombros",
  "Peito / Coração",
  "Estômago / Plexo solar",
  "Abdômen / Útero",
  "Quadril / Base",
  "Pernas",
  "Difuso pelo corpo todo",
  "Outro",
];

export const padraoDormindoOpts = [
  "Durmo bem e profundamente",
  "Demoro para dormir (ansiedade)",
  "Acordo no meio da noite",
  "Durmo muito mas não descanso",
  "Uso algo para conseguir dormir",
  "Outro",
];

export const nivelEnergiaOpts = [
  "Esgotada / sem energia",
  "Oscila muito",
  "Regular",
  "Boa na maior parte do tempo",
  "Alta e consistente",
  "Outro",
];

export const relacaoComidaOpts = [
  "Amorosa e equilibrada",
  "Controladora / compulsiva",
  "Ignorada (não presto atenção)",
  "Conflituosa / me critico muito",
  "Em processo de melhora",
  "Outro",
];

// Bloco 5
export const bloqueioSonhoOpts = [
  "Falta de dinheiro",
  "Falta de tempo",
  "Medo de falhar",
  "Não sei por onde começar",
  "Já tentei e não funcionou",
  "Sinto que não mereço",
  "Outro",
];

export const prazSonhoOpts = [
  "6 meses",
  "1 ano",
  "2 anos",
  "3 a 5 anos",
  "Não tenho prazo definido",
  "Outro",
];

export const frenteTrabalhoOpts = [
  "Cura emocional de traumas",
  "Reprogramação de crenças limitantes",
  "Cocriação de metas e manifestação",
  "Equilíbrio entre as três",
  "Outro",
];

export const TOTAL_STEPS = 11;
