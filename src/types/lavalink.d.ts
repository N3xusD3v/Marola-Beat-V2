// `TrackRequester` is exported by lavalink-client as an empty interface meant for augmentation
// by consumers. We pass a discord.js `GuildMember` as the requester on every search() call (not
// a plain `User`), so that "Pedido por" shows the server nickname/display name instead of the
// account's @username — shape this to the subset of `GuildMember` we actually read back (see
// `src/lib/embeds.ts`).
// The `export {}` makes this file a module rather than a global script — without it, the
// `declare module` block below is parsed as a brand new ambient module instead of an
// augmentation, which silently breaks every other type import from 'lavalink-client'.
export {};

declare module 'lavalink-client' {
  interface TrackRequester {
    id: string;
    displayName: string;
    displayAvatarURL: () => string;
  }
}
