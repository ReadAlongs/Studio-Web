/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { Alignment, InterfaceLanguage, Page, RASMeta, ReadAlongMode, ScrollBehaviour } from "./index.d";
import { Subject } from "rxjs";
import { Element } from "@stencil/core";
export { Alignment, InterfaceLanguage, Page, RASMeta, ReadAlongMode, ScrollBehaviour } from "./index.d";
export { Subject } from "rxjs";
export { Element } from "@stencil/core";
export namespace Components {
    interface ReadAlong {
        /**
          * URL of the audio file
         */
        "audio": string;
        /**
          * Auto Pause at end of every page
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
          * get Pages
         */
        "getMeta": () => Promise<RASMeta>;
        /**
          * get Pages
         */
        "getPages": () => Promise<Page[]>;
        /**
          * Get ReadAlong Element
         */
        "getReadAlongElement": () => Promise<Element>;
        /**
          * URL of the aligned text as readalong XML
         */
        "href": string;
        /**
          * Define a path for where the image assets are located This should be used instead of use-assets-folder. Defaults to 'assets/'. The empty string means that image paths will not have a prefix added to them. Use of the forward slash is optional.
         */
        "imageAssetsFolder": string;
        /**
          * Language  of the interface. In 639-3 code. Options are "eng" (English), "fra" (French) or "spa" (Spanish)
         */
        "language": InterfaceLanguage;
        /**
          * Choose mode of ReadAlong - either view (default) or edit
         */
        "mode": ReadAlongMode;
        /**
          * Toggles the page scrolling from horizontal to vertical. Defaults to horizontal
         */
        "pageScrolling": "horizontal" | "vertical";
        /**
          * Control the range of the playback rate: allow speeds from 100 - playback-rate-range to 100 + playback-rate-range.
         */
        "playbackRateRange": number;
        /**
          * Select whether scrolling between pages should be "smooth" (default nicely animated, good for fast computers) or "auto" (choppy but much less compute intensive)
         */
        "scrollBehaviour": ScrollBehaviour;
        /**
          * Overlay This is an SVG overlay to place over the progress bar
         */
        "svgOverlay": string;
        /**
          * Theme to use: ['light', 'dark'] defaults to 'dark'
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
declare global {
    interface HTMLReadAlongElement extends Components.ReadAlong, HTMLStencilElement {
    }
    var HTMLReadAlongElement: {
        prototype: HTMLReadAlongElement;
        new (): HTMLReadAlongElement;
    };
    interface HTMLElementTagNameMap {
        "read-along": HTMLReadAlongElement;
    }
}
declare namespace LocalJSX {
    interface ReadAlong {
        /**
          * URL of the audio file
         */
        "audio"?: string;
        /**
          * Auto Pause at end of every page
         */
        "autoPauseAtEndOfPage"?: boolean;
        /**
          * Optional custom Stylesheet to override defaults
         */
        "cssUrl"?: string;
        /**
          * Show text translation  on at load time
         */
        "displayTranslation"?: boolean;
        /**
          * URL of the aligned text as readalong XML
         */
        "href"?: string;
        /**
          * Define a path for where the image assets are located This should be used instead of use-assets-folder. Defaults to 'assets/'. The empty string means that image paths will not have a prefix added to them. Use of the forward slash is optional.
         */
        "imageAssetsFolder"?: string;
        /**
          * Language  of the interface. In 639-3 code. Options are "eng" (English), "fra" (French) or "spa" (Spanish)
         */
        "language"?: InterfaceLanguage;
        /**
          * Choose mode of ReadAlong - either view (default) or edit
         */
        "mode"?: ReadAlongMode;
        /**
          * Toggles the page scrolling from horizontal to vertical. Defaults to horizontal
         */
        "pageScrolling"?: "horizontal" | "vertical";
        /**
          * Control the range of the playback rate: allow speeds from 100 - playback-rate-range to 100 + playback-rate-range.
         */
        "playbackRateRange"?: number;
        /**
          * Select whether scrolling between pages should be "smooth" (default nicely animated, good for fast computers) or "auto" (choppy but much less compute intensive)
         */
        "scrollBehaviour"?: ScrollBehaviour;
        /**
          * Overlay This is an SVG overlay to place over the progress bar
         */
        "svgOverlay"?: string;
        /**
          * Theme to use: ['light', 'dark'] defaults to 'dark'
         */
        "theme"?: string;
        /**
          * DEPRECATED Will be removed in version 2.0.0 Toggle the use of an assets folder. Defaults to undefined. Previously (<1.2.0) defaulted to 'true'. .readalong files should just contain base filenames not the full paths to the images.
         */
        "useAssetsFolder"?: boolean;
    }
    interface IntrinsicElements {
        "read-along": ReadAlong;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "read-along": LocalJSX.ReadAlong & JSXBase.HTMLAttributes<HTMLReadAlongElement>;
        }
    }
}
