# Uso Correto do YouTube no Marola Beat

Este documento explica como o Marola Beat usa o YouTube de forma ética e dentro dos limites permitidos.

## Método de Acesso

O bot **não** usa:

- ❌ Scraping direto do YouTube
- ❌ Download de arquivos de vídeo
- ❌ Bypass de restrições do YouTube
- ❌ APIs não autorizadas

O bot **usa**:

- ✅ **Lavalink** - Servidor de áudio separado que gerencia streams
- ✅ **OAuth2 do YouTube** - Autenticação oficial com conta Google
- ✅ **Plugin oficial** `youtube-source` mantido pela comunidade Lavalink
- ✅ **Streaming direto** - O áudio é transmitido em tempo real, não baixado

## OAuth2 e Autenticação

### Como Funciona

1. Você autentica uma conta Google **pessoal** (burner, não a principal)
2. O Lavalink usa essa autenticação para acessar o YouTube
3. O bot tem acesso ao mesmo conteúdo que essa conta teria no navegador
4. O token é renovado automaticamente pelo Lavalink

### Configuração (já feita no projeto)

A configuração em `lavalink/application.yml` usa:

- Client **TV** (único compatível com OAuth na versão 1.18.2)
- Token de refresh armazenado em variável de ambiente
- Remote cipher para evitar bloqueios por mudanças no player do YouTube

## Limitações e Restrições

### O que FUNCIONA ✅

- Vídeos públicos do YouTube
- Vídeos não listados (se você tiver o link)
- Playlists públicas
- Músicas disponíveis no YouTube Music
- Transmissões ao vivo públicas

### O que PODE FALHAR ❌

- Vídeos com restrição de idade (se a conta não verificou idade)
- Vídeos privados (mesmo com o link)
- Conteúdo com bloqueio regional (depende da localização do servidor)
- Vídeos que exigem assinatura Premium
- Vídeos bloqueados por direitos autorais

## Uso Ético e Legal

### Para Uso Pessoal/Privado (seu caso)

✅ **PERMITIDO**:

- Uso em servidor privado do Discord com amigos
- Uma conta autenticada pessoal
- Streaming em tempo real (não download)
- Respeito aos termos de serviço do YouTube

⚠️ **ATENÇÃO**:

- Use uma conta Google **burner** (secundária), não a principal
- Não compartilhe o bot publicamente
- Não monetize o serviço
- Não faça uso comercial

### Para Distribuição Pública (NÃO é seu caso)

Se você fosse distribuir o bot para centenas de servidores:

❌ **NÃO PERMITIDO sem autorização explícita**:

- Distribuição em massa (múltiplos servidores desconhecidos)
- Uso comercial ou monetizado
- Bypass sistemático de anúncios do YouTube
- Violação dos Termos de Serviço do YouTube

## Rate Limiting

O bot implementa **rate limiting** (10 requisições por minuto por usuário) para:

- ✅ Evitar sobrecarga do YouTube
- ✅ Reduzir chance de bloqueios
- ✅ Simular uso humano normal
- ✅ Manter o serviço estável

**Por que 10/min?** O bot é usado apenas por você e pessoas no seu canal de voz (acesso restrito), então o limite pode ser mais generoso que em bots públicos.

## Alternativas Recomendadas

Se você quer **máxima conformidade** com os termos do YouTube:

1. **YouTube Premium** + API oficial (para uso comercial)
2. **YouTube Music API** (limitada, mas oficial)
3. **SoundCloud, Bandcamp, Vimeo** (já suportados pelo bot)
4. **Spotify** (via plugins adicionais do Lavalink)

## Resolução de Problemas

### "This video requires login"

**Causa**: Vídeo restrito ou token OAuth expirou
**Solução**:

1. Refaça o OAuth (veja `DEPLOYMENT.md`)
2. Verifique se a conta tem verificação de idade
3. Tente outro vídeo similar

### "Sign in to confirm you're not a bot"

**Causa**: YouTube detectou padrão não-humano
**Solução**:

1. Aguarde alguns minutos
2. Reduza a frequência de buscas
3. Use URLs diretos em vez de buscas

### "Video unavailable"

**Causa**: Vídeo foi removido ou bloqueado
**Solução**: Use outro vídeo

### "Not available in your country"

**Causa**: Bloqueio regional
**Solução**: Use VPN no servidor (não recomendado) ou escolha outro conteúdo

## Referências

- [Termos de Serviço do YouTube](https://www.youtube.com/t/terms)
- [Políticas de API do YouTube](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- [Lavalink Documentação](https://lavalink.dev/)
- [Plugin youtube-source](https://github.com/lavalink-devs/youtube-source)

## Resumo

Para seu uso **pessoal com amigos em um servidor privado**:

✅ **Você está dentro das regras** se:

- Usa OAuth2 com conta pessoal
- Não monetiza
- Não distribui publicamente
- Respeita rate limits
- Aceita que alguns conteúdos podem falhar

⚠️ **Fique atento se**:

- Começar a usar em muitos servidores
- Receber solicitações de uso público
- Pensar em monetizar

**Dúvidas?** Consulte os Termos de Serviço do YouTube diretamente ou um advogado para casos comerciais.
