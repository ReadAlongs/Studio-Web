/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { Alignment, InterfaceLanguage, ReadAlongMode, ScrollBehaviour } from "./index.d";
import { Subject } from "rxjs";
import { Element } from "@stencil/core";
export { Alignment, InterfaceLanguage, ReadAlongMode, ScrollBehaviour } from "./index.d";
export { Subject } from "rxjs";
export { Element } from "@stencil/core";
export namespace Components {
    interface ErrorMessage {
        /**
          * Cypress data-test-id value.
         */
        "data_cy": string;
        /**
          * The message to display to the user.
         */
        "msg": string;
        /**
          * The on-screen duration of the error message. Zero disables this functionality, the message remains on the screen.
          * @default 0
         */
        "timeout"?: number;
    }
    interface ReadAlong {
        /**
          * Add custom font
         */
        "addCustomFont": (fontData: string) => Promise<void>;
        /**
          * URL of the audio file
         */
        "audio": string;
        /**
          * Auto Pause at end of every page
          * @default false
         */
        "autoPauseAtEndOfPage"?: boolean;
        /**
          * Change theme
         */
        "changeTheme": () => Promise<void>;
        /**
          * Optional custom Stylesheet to override defaults
         */
        "cssUrl"?: string;
        /**
          * Show text translation  on at load time
          * @default true
         */
        "displayTranslation": boolean;
        /**
          * Get Alignments
         */
        "getAlignments": () => Promise<Alignment>;
        /**
          * Get Current Word
         */
        "getCurrentWord": () => Promise<Subject<string>>;
        /**
          * Get Images
         */
        "getImages": () => Promise<object>;
        /**
          * Get ReadAlong Element
         */
        "getReadAlongElement": () => Promise<Element>;
        /**
          * Get Translations
         */
        "getTranslations": () => Promise<object>;
        /**
          * URL of the aligned text as readalong XML
         */
        "href": string;
        /**
          * Define a path for where the image assets are located This should be used instead of use-assets-folder. Defaults to 'assets/'. The empty string means that image paths will not have a prefix added to them. Use of the forward slash is optional.
          * @default "assets/"
         */
        "imageAssetsFolder": string;
        /**
          * Language  of the interface. In 639-3 code. Options are "eng" (English), "fra" (French) or "spa" (Spanish)
          * @default "eng"
         */
        "language": InterfaceLanguage;
        /**
          * Choose mode of ReadAlong - either view (default) or edit
          * @default "VIEW"
         */
        "mode": ReadAlongMode;
        /**
          * Toggles the page scrolling from horizontal to vertical. Defaults to horizontal
          * @default "horizontal"
         */
        "pageScrolling": "horizontal" | "vertical";
        /**
          * Control the range of the playback rate: allow speeds from 100 - playback-rate-range to 100 + playback-rate-range.
          * @default 15
         */
        "playbackRateRange": number;
        /**
          * Select whether scrolling between pages should be "smooth" (default nicely animated, good for fast computers) or "auto" (choppy but much less compute intensive)
          * @default "smooth"
         */
        "scrollBehaviour": ScrollBehaviour;
        /**
          * Update stylesheet
          * @param url
         */
        "setCss": (url: any) => Promise<void>;
        /**
          * Overlay This is an SVG overlay to place over the progress bar
         */
        "svgOverlay": string;
        /**
          * Theme to use: ['light', 'dark'] defaults to 'dark'
          * @default "light"
         */
        "theme": string;
        /**
          * Update Single Sprite
         */
        "updateSpriteAlignments": (alignment: Alignment) => Promise<void>;
        /**
          * DEPRECATED Will be removed in version 2.0.0 Toggle the use of an assets folder. Defaults to undefined. Previously (<1.2.0) defaulted to 'true'. .readalong files should just contain base filenames not the full paths to the images.
         */
        "useAssetsFolder"?: boolean;
    }
}
export interface ErrorMessageCustomEvent<T> extends CustomEvent<T> {
    detail: T;
    target: HTMLErrorMessageElement;
}
declare global {
    interface HTMLErrorMessageElementEventMap {
        "expired": any;
    }
    interface HTMLErrorMessageElement extends Components.ErrorMessage, HTMLStencilElement {
        addEventListener<K extends keyof HTMLErrorMessageElementEventMap>(type: K, listener: (this: HTMLErrorMessageElement, ev: ErrorMessageCustomEvent<HTMLErrorMessageElementEventMap[K]>) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
        removeEventListener<K extends keyof HTMLErrorMessageElementEventMap>(type: K, listener: (this: HTMLErrorMessageElement, ev: ErrorMessageCustomEvent<HTMLErrorMessageElementEventMap[K]>) => any, options?: boolean | EventListenerOptions): void;
        removeEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
        removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    }
    var HTMLErrorMessageElement: {
        prototype: HTMLErrorMessageElement;
        new (): HTMLErrorMessageElement;
    };
    interface HTMLReadAlongElement extends Components.ReadAlong, HTMLStencilElement {
    }
    var HTMLReadAlongElement: {
        prototype: HTMLReadAlongElement;
        new (): HTMLReadAlongElement;
    };
    interface HTMLElementTagNameMap {
        "error-message": HTMLErrorMessageElement;
        "read-along": HTMLReadAlongElement;
    }
}
declare namespace LocalJSX {
    interface ErrorMessage {
        /**
          * Cypress data-test-id value.
         */
        "data_cy"?: string;
        /**
          * The message to display to the user.
         */
        "msg"?: string;
        /**
          * Event get emitted when the timer expires.
         */
        "onExpired"?: (event: ErrorMessageCustomEvent<any>) => void;
        /**
          * The on-screen duration of the error message. Zero disables this functionality, the message remains on the screen.
          * @default 0
         */
        "timeout"?: number;
    }
    interface ReadAlong {
        /**
          * URL of the audio file
         */
        "audio"?: string;
        /**
          * Auto Pause at end of every page
          * @default false
         */
        "autoPauseAtEndOfPage"?: boolean;
        /**
          * Optional custom Stylesheet to override defaults
         */
        "cssUrl"?: string;
        /**
          * Show text translation  on at load time
          * @default true
         */
        "displayTranslation"?: boolean;
        /**
          * URL of the aligned text as readalong XML
         */
        "href"?: string;
        /**
          * Define a path for where the image assets are located This should be used instead of use-assets-folder. Defaults to 'assets/'. The empty string means that image paths will not have a prefix added to them. Use of the forward slash is optional.
          * @default "assets/"
         */
        "imageAssetsFolder"?: string;
        /**
          * Language  of the interface. In 639-3 code. Options are "eng" (English), "fra" (French) or "spa" (Spanish)
          * @default "eng"
         */
        "language"?: InterfaceLanguage;
        /**
          * Choose mode of ReadAlong - either view (default) or edit
          * @default "VIEW"
         */
        "mode"?: ReadAlongMode;
        /**
          * Toggles the page scrolling from horizontal to vertical. Defaults to horizontal
          * @default "horizontal"
         */
        "pageScrolling"?: "horizontal" | "vertical";
        /**
          * Control the range of the playback rate: allow speeds from 100 - playback-rate-range to 100 + playback-rate-range.
          * @default 15
         */
        "playbackRateRange"?: number;
        /**
          * Select whether scrolling between pages should be "smooth" (default nicely animated, good for fast computers) or "auto" (choppy but much less compute intensive)
          * @default "smooth"
         */
        "scrollBehaviour"?: ScrollBehaviour;
        /**
          * Overlay This is an SVG overlay to place over the progress bar
         */
        "svgOverlay"?: string;
        /**
          * Theme to use: ['light', 'dark'] defaults to 'dark'
          * @default "light"
         */
        "theme"?: string;
        /**
          * DEPRECATED Will be removed in version 2.0.0 Toggle the use of an assets folder. Defaults to undefined. Previously (<1.2.0) defaulted to 'true'. .readalong files should just contain base filenames not the full paths to the images.
         */
        "useAssetsFolder"?: boolean;
    }
    interface IntrinsicElements {
        "error-message": ErrorMessage;
        "read-along": ReadAlong;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "error-message": LocalJSX.ErrorMessage & JSXBase.HTMLAttributes<HTMLErrorMessageElement>;
            "read-along": LocalJSX.ReadAlong & JSXBase.HTMLAttributes<HTMLReadAlongElement>;
        }
    }
}
