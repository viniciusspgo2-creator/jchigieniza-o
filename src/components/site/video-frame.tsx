/**
 * Moldura sofisticada para os vídeos da galeria: borda em gradiente,
 * painel navy interno, ornamentos de canto, faixa de identificação e
 * selo "sem áudio". O embed do YouTube carrega silenciado (mute=1),
 * em loop, sem controles e SEM VÍDEOS SUGERIDOS.
 *
 * ANONIMATO: o iframe é renderizado 40% maior que a janela visível e
 * centralizado (overflow-hidden) — isso recorta as faixas onde o YouTube
 * mostra avatar, título, nome do canal e marca, deixando passar apenas
 * a imagem do serviço em execução, sem identificação de terceiros.
 */
export function VideoFrame({
  id,
  title,
  index,
}: {
  id: string;
  title: string;
  index: number;
}) {
  return (
    <figure className="group relative">
      {/* borda em gradiente (detalhe externo) */}
      <div className="rounded-[26px] bg-gradient-to-b from-aqua-200/70 via-white/15 to-deep/60 p-[1.5px] shadow-deep transition-transform duration-300 group-hover:-translate-y-1">
        <div className="relative rounded-[24px] bg-deep p-2.5 sm:p-3">
          {/* ornamentos de canto */}
          <span aria-hidden="true" className="pointer-events-none absolute left-1.5 top-1.5 h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-aqua-300/60" />
          <span aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1.5 h-5 w-5 rounded-tr-lg border-r-2 border-t-2 border-aqua-300/60" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-1.5 left-1.5 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-aqua-300/60" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-1.5 right-1.5 h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-aqua-300/60" />

          {/* faixa superior */}
          <div className="flex items-center justify-between px-1.5 pb-2.5 pt-0.5">
            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-aqua-200/90">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-aqua-300 shadow-[0_0_8px_rgba(111,210,246,0.9)]" />
              JC · Atendimento
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100/60">
              Sem áudio
            </span>
          </div>

          {/* player anonimizado: janela recorta topo/base do embed (onde ficam canal, título e logo) */}
          <div className="relative aspect-[9/16] overflow-hidden rounded-[16px] ring-1 ring-white/10">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}?mute=1&loop=1&playlist=${id}&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&controls=0&color=white&showinfo=0`}
              title={`Vídeo ${index + 1} — atendimento de higienização`}
              loading="lazy"
              allow="encrypted-media; picture-in-picture"
              className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 border-0"
            />
            {/* redundância: scrims em gradiente sobre as zonas de overlay (topo/base) —
                mascaram qualquer resíduo de canal/logo com o mesmo tratamento navy do site */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[14%] bg-gradient-to-b from-deep via-deep/70 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[14%] bg-gradient-to-t from-deep via-deep/70 to-transparent" />
          </div>

          {/* legenda */}
          <figcaption className="px-2 pb-1 pt-3 text-center">
            <span className="text-[12.5px] font-semibold text-blue-100/80">{title}</span>
            <span className="mt-0.5 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-blue-100/35">
              Atendimento a domicílio
            </span>
          </figcaption>
        </div>
      </div>
    </figure>
  );
}
