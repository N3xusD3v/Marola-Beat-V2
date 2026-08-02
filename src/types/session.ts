import 'express-session';

export interface SessionUser {
  id: string;
  username: string;
  avatar: string | null;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    oauthState?: string;
    // IDs dos servidores do usuário no Discord (escopo OAuth `guilds`), buscados uma vez no
    // login — evita bater na API do Discord de novo a cada carregamento do painel. Cruzado com
    // `client.guilds.cache` (servidores onde o bot está) pra montar a lista em GET /api/guilds.
    userGuildIds?: string[];
    // Servidor escolhido na tela de seleção (ou auto-selecionado, se só há um em comum).
    // Ausente = usuário ainda não escolheu qual servidor gerenciar.
    selectedGuildId?: string;
  }
}
