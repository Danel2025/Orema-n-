import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";

// Configuration de la vidéo
const FPS = 30;
const DURATION_IN_SECONDS = 185; // Intro (3.5s) + Démo vidéo (175s) + Outro (5s) ≈ 185s

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={DURATION_IN_SECONDS * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
