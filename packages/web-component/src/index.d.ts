export interface Page {
  id: string;
  paragraphs: Array<Element>;
  img?: string;
  attributes?: NamedNodeMap[];
}

export interface Alignment {
  [id: string]: [number, number];
}

export type ReadAlongMode = "VIEW" | "EDIT";
export type InterfaceLanguage = "eng" | "fra" | "spa"; //iso 639-3 code
export type Translation = {
  [lang in InterfaceLanguage]: string;
};

export type LoadingError = {
  type: number;
  message: string;
};

export type ScrollBehaviour = "auto" | "smooth";

export type UserPreferences = {
  version: string;
  autoPauseAtEndOfPage: boolean;
  scrollBehaviour: ScrollBehaviour;
  language: InterfaceLanguage;
  theme: string;
};
/**
 * .readalong file version >= 1.1 has meta tags
 * the meta tags can be used to define annotated layers
 *
 */
export type RASMeta = {
  [key as string]: string[];
};
export type RASDoc = {
  pages: Array<Page>;
  meta: RASMeta;
};

export type RASAnnotation = {
  id: string;
  isVisible: boolean;
  name: string;
};
