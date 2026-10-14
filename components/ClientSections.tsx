"use client";

import dynamic from "next/dynamic";

const Skeleton = () => (
  <div className="h-64 rounded-2xl bg-white/[0.02] animate-pulse" />
);

export const ArchitectureDiagram = dynamic(
  () => import("@/components/ArchitectureDiagram"),
  { ssr: false, loading: Skeleton }
);

export const PipelineTrace = dynamic(
  () => import("@/components/PipelineTrace"),
  { ssr: false, loading: Skeleton }
);

export const ScaleBinding = dynamic(
  () => import("@/components/ScaleBinding"),
  { ssr: false, loading: Skeleton }
);

export const FitEngine = dynamic(
  () => import("@/components/FitEngine"),
  { ssr: false, loading: Skeleton }
);

export const Particles = dynamic(
  () => import("@/components/Particles"),
  { ssr: false }
);

export const SceneBackground = dynamic(
  () => import("@/components/SceneBackground"),
  { ssr: false }
);

export const LoadingScreen = dynamic(
  () => import("@/components/LoadingScreen"),
  { ssr: false }
);

export { default as Reveal } from "@/components/Reveal";
