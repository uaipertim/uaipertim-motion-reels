import React from "react";
import { Composition, Still, staticFile } from "remotion";
import { fontsReady } from "./components/Fonts";
import { TL } from "./config/timeline";
import { TL2 } from "./v2/config/timeline";
import { TL3 } from "./v3/config/timeline";
import { TL4 } from "./v4/config/timeline";
import { CARDS, TLS } from "./story/config/timeline";
import { Video } from "./Video";
import { Video2 } from "./v2/Video2";
import { Video3 } from "./v3/Video3";
import { Video4 } from "./v4/Video4";
import { StoryCard, StoryPreview } from "./story/StoryConheca";
import { CoverCard } from "./components/Cover";
import { COVERS } from "./covers/covers";
import { DicionarioMineiro, DicionarioProps, Timing, measureLayout, nn } from "./dicionario/DicionarioMineiro";
import ep01 from "../episodios/dicionario/01-uai.json";
import { CarrosselFacim, CarrosselProps, SLIDE, measureSlide } from "./carrossel/CarrosselFacim";
import facim01 from "../carrosseis/facim/01-antes-que-voce-pergunte.json";
import { CorteCurto, CorteProps, measureCorte } from "./cortes/Corte";
import corteA from "../cortes/corte-A.json";
import { DestaqueCapa } from "./story/DestaqueCapa";
import { CapaDicionario, CapaDicionarioProps, measureCapaDicionario } from "./dicionario/CapaDicionario";
import dic01 from "../episodios/dicionario/01-uai.json";
import dic02 from "../episodios/dicionario/02-pertim.json";
import dic03 from "../episodios/dicionario/03-trem.json";
import dic04 from "../episodios/dicionario/04-facim.json";
import dic05 from "../episodios/dicionario/05-so.json";
import dic06 from "../episodios/dicionario/06-nossinhora.json";
import dic07 from "../episodios/dicionario/07-quitanda.json";

// Capas novas do Dicionário Mineiro (só PNG): a palavra é medida com as fontes carregadas.
const capaDicionarioMetadata = async ({ props }: { props: CapaDicionarioProps }) => {
  await fontsReady;
  return { props: { ...props, layout: measureCapaDicionario(props) } };
};
const CAPAS_DICIONARIO = [dic01, dic02, dic03, dic04, dic05, dic06, dic07] as unknown as CapaDicionarioProps[];
import { DESTAQUES, DESTAQUE_IDS, DestaqueCard, DestaqueNome } from "./story/destaques/Destaques";
import { CAPA_FACIM, CapaFacim, CapaFacimProps, measureCapaFacim } from "./carrossel/CapaFacim";
import { CapaReel, CapaReelProps, measureCapaReel } from "./covers/CapaReel";
import { CAPAS_REELS } from "./covers/capasReels";
import { PRAZER, PertimBocaTeste, PrazerPertim, PrazerPertimCapa } from "./prazer-pertim/PrazerPertim";
import facim02 from "../carrosseis/facim/02-como-vai-funcionar.json";
import facim03 from "../carrosseis/facim/03-o-que-vai-ter.json";
import facim05 from "../carrosseis/facim/05-tem-comercio.json";
import facim07 from "../carrosseis/facim/07-saber-primeiro.json";
import facim08 from "../carrosseis/facim/08-por-que-comprar-pertim.json";
import facim09 from "../carrosseis/facim/09-domingo-a-noite.json";

// Capas novas dos carrosséis "Facim Facim" (só o slide-1, no modelo das capas do Dicionário): o título é medido com
// as fontes carregadas. Um carrossel entra aqui quando o JSON dele tem o campo "capaNova".
const capaFacimMetadata = async ({ props }: { props: CapaFacimProps }) => {
  await fontsReady;
  return { props: { ...props, layout: measureCapaFacim(props) } };
};
// Capas novas dos Reels já publicados (só PNG): o título é medido com as fontes carregadas.
const capaReelMetadata = async ({ props }: { props: CapaReelProps }) => {
  await fontsReady;
  return { props: { ...props, layout: measureCapaReel(props) } };
};
const CAPAS_FACIM = [facim01, facim02, facim03, facim05, facim07, facim08, facim09] as unknown as CapaFacimProps[];

// Cortes curtos: duração = trecho do original + fecho; textos medidos com as fontes carregadas.
const corteMetadata = async ({ props }: { props: CorteProps }) => {
  await fontsReady;
  return { durationInFrames: (props.segura ?? 0) + props.fim - props.inicio + props.fechoDur, props: { ...props, layout: measureCorte(props) } };
};

// Carrossel "Facim, facim": cada slide é um still; o carrossel = JSON em --props + "slide" (índice, a partir de 0).
const carrosselMetadata = async ({ props }: { props: CarrosselProps }) => {
  await fontsReady;
  return { props: { ...props, layout: measureSlide(props, props.slide ?? 0) } };
};

// Dicionário Mineiro: duração pela voz (timing.json gerado por audio/dicionario.py) e textos medidos com as fontes carregadas.
// Episódio = JSON passado em --props (ex.: --props=episodios/dicionario/02-pertim.json); sem --props, abre o 01.
const dicionarioMetadata = async ({ props }: { props: DicionarioProps }) => {
  await fontsReady;
  const res = await fetch(staticFile(`audio/dicionario/${nn(props.numero)}/timing.json`));
  if (!res.ok) throw new Error(`Sem timing do episódio ${nn(props.numero)}: rode python3 audio/dicionario.py <json do episódio>`);
  const timing: Timing = await res.json();
  return { durationInFrames: timing.durationInFrames, props: { ...props, timing, layout: measureLayout(props) } };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Video1-NaoPrecisaBaixar"
      component={Video}
      durationInFrames={TL.durationInFrames}
      fps={TL.fps}
      width={TL.width}
      height={TL.height}
      defaultProps={{ withAudio: true }}
    />
    <Composition
      id="Video2-VaiFuncionarAssim"
      component={Video2}
      durationInFrames={TL2.durationInFrames}
      fps={TL2.fps}
      width={TL2.width}
      height={TL2.height}
      defaultProps={{ withAudio: true }}
    />
    <Composition
      id="Video3-QualComercioPrecisa"
      component={Video3}
      durationInFrames={TL3.durationInFrames}
      fps={TL3.fps}
      width={TL3.width}
      height={TL3.height}
      defaultProps={{ withAudio: true, audio: "audio/v3/mix_semvoz.wav" }}
    />
    <Composition
      id="Video3-QualComercioPrecisa-Narrado"
      component={Video3}
      durationInFrames={TL3.durationInFrames}
      fps={TL3.fps}
      width={TL3.width}
      height={TL3.height}
      defaultProps={{ withAudio: true, audio: "audio/v3/mix.wav" }}
    />
    <Composition
      id="Video4-EleTeAcha"
      component={Video4}
      durationInFrames={TL4.durationInFrames}
      fps={TL4.fps}
      width={TL4.width}
      height={TL4.height}
      defaultProps={{ withAudio: true }}
    />
    {/* Story "Conheça": 4 cards (1 MP4 cada) + prévia com os 4 em sequência */}
    {(["card1", "card2", "card3", "card4"] as const).map((card, i) => (
      <Composition
        key={card}
        id={`Story-Conheca-Card${i + 1}`}
        component={StoryCard}
        durationInFrames={CARDS[card].duration}
        fps={TLS.fps}
        width={TLS.width}
        height={TLS.height}
        defaultProps={{ card, withAudio: true }}
      />
    ))}
    {/* Capas (thumbnails) dos Reels */}
    <Still id="Capa-Video1" component={CoverCard} width={1080} height={1920} defaultProps={COVERS.video1} />
    <Still id="Capa-Video2" component={CoverCard} width={1080} height={1920} defaultProps={COVERS.video2} />
    <Still id="Capa-Video3" component={CoverCard} width={1080} height={1920} defaultProps={COVERS.video3} />
    <Composition
      id="Story-Conheca-Previa"
      component={StoryPreview}
      durationInFrames={TLS.durationInFrames}
      fps={TLS.fps}
      width={TLS.width}
      height={TLS.height}
      defaultProps={{ withAudio: true }}
    />
    <Composition
      id="DicionarioMineiro"
      component={DicionarioMineiro}
      durationInFrames={420}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={ep01 as DicionarioProps}
      calculateMetadata={dicionarioMetadata}
    />
    <Composition
      id="CarrosselFacim"
      component={CarrosselFacim}
      durationInFrames={1}
      fps={30}
      width={SLIDE.width}
      height={SLIDE.height}
      defaultProps={{ ...(facim01 as unknown as CarrosselProps), slide: 0 }}
      calculateMetadata={carrosselMetadata}
    />
    <Composition
      id="CorteCurto"
      component={CorteCurto}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={corteA as CorteProps}
      calculateMetadata={corteMetadata}
    />
    {/* Stories de destaque (Dúvidas, Lojista, Explica, Sô!): 1 composição (e 1 MP4) por card, como no "Conheça" */}
    {(Object.keys(DESTAQUES) as DestaqueNome[]).flatMap((nome) =>
      DESTAQUES[nome].map((_, i) => (
        <Composition
          key={`${nome}${i}`}
          id={`Destaque-${DESTAQUE_IDS[nome]}-Card${i + 1}`}
          component={DestaqueCard}
          durationInFrames={180}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ nome, card: i, withAudio: true }}
        />
      )),
    )}
    {/* Capas novas do Dicionário Mineiro: CapaDicionario-01 … -07 (npm run capas:dicionario) */}
    {CAPAS_DICIONARIO.map((ep) => (
      <Composition
        key={ep.numero}
        id={`CapaDicionario-${String(ep.numero).padStart(2, "0")}`}
        component={CapaDicionario}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ep}
        calculateMetadata={capaDicionarioMetadata}
      />
    ))}
    {/* Capas novas dos carrosséis Facim Facim: CapaFacim-01 … -09 (npm run capas:facim) */}
    {CAPAS_FACIM.filter((c) => c.capaNova).map((c) => (
      <Composition
        key={c.numero}
        id={`CapaFacim-${String(c.numero).padStart(2, "0")}`}
        component={CapaFacim}
        durationInFrames={1}
        fps={30}
        width={CAPA_FACIM.width}
        height={CAPA_FACIM.height}
        defaultProps={c}
        calculateMetadata={capaFacimMetadata}
      />
    ))}
    {/* Capas novas dos Reels já publicados: CapaReel-<id> (npm run capas:reels) */}
    {CAPAS_REELS.map((c) => (
      <Composition key={c.id} id={`CapaReel-${c.id}`} component={CapaReel} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={c} calculateMetadata={capaReelMetadata} />
    ))}
    {/* Reel de teste "Prazer, Pertim" (o personagem com rig): o vídeo, a capa e o teste da boca (reels/prazer-pertim) */}
    <Composition id="PrazerPertim" component={PrazerPertim} durationInFrames={PRAZER.duracao} fps={PRAZER.fps} width={1080} height={1920} calculateMetadata={async () => { await fontsReady; return {}; }} />
    <Still id="PrazerPertim-Capa" component={PrazerPertimCapa} width={1080} height={1920} calculateMetadata={async () => { await fontsReady; return {}; }} />
    <Composition id="PertimBocaTeste" component={PertimBocaTeste} durationInFrames={PRAZER.bocaTeste} fps={PRAZER.fps} width={1080} height={1080} />
    <Still id="Destaque-Capa" component={DestaqueCapa} width={1080} height={1920} defaultProps={{ icone: "conheca" as const }} />
  </>
);
