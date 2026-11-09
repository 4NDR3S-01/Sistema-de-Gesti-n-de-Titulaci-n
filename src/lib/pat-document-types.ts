import type { PatExtraData } from "@/lib/pat-options";

/** Datos del formato PAT-04-F-002 (los usa el generador de PDF del servidor). */
export type PatDocumentMember = {
  fullName: string;
  cedula: string;
  sex: string;
  faculty: string;
  career: string;
  institutionalEmail: string;
  personalEmail: string;
  phone: string;
  landline: string;
  semester?: number | null;
  signature?: string | null;
} & PatExtraData;

export type PatDocumentData = {
  registrationId: number;
  version: string;
  participationType: "INDIVIDUAL" | "GRUPAL";
  modality: string;
  presentationMechanism: string;
  requestedTutor?: string | null;
  title: string;
  problem: string;
  articulations: string[];
  members: PatDocumentMember[];
};
