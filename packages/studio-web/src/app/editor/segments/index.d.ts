import { Styles } from "wavesurfer.js/types/util";
import {
  PluginDefinition,
  PluginParams,
  WaveSurferPlugin,
} from "wavesurfer.js/types/plugin";
import Observer from "wavesurfer.js/util/observer";
import WaveSurfer from "wavesurfer.js";

declare module "wavesurfer.js" {
  interface WaveSurfer {
    addSegment(segmentParams: SegmentParams): void;
    clearSegments(): void;
  }
}

export default class SegmentsPlugin
  extends Observer
  implements WaveSurferPlugin
{
  constructor(params: SegmentsPluginParams, ws: WaveSurfer);
  static create(params: SegmentsPluginParams): PluginDefinition;
  destroy(): void;
  init(): void;

  add(params: SegmentParams): Segment;
  clear(): void;
  getCurrentSegment(): Segment | null;
  getSegmentSnapToGridValue(value: number, params: SegmentParams): number;

  readonly list: { [id: string]: Segment };
  readonly maxSegments: number;
  readonly params: SegmentsPluginParams;
  readonly util: WaveSurfer["util"];
  readonly wavesurfer: WaveSurfer;
  readonly wrapper: HTMLElement;
}

export interface SegmentsPluginParams extends PluginParams {
  /** Segments that should be added upon initialisation. */
  segments?: SegmentParams[];
  /** The sensitivity of the mouse dragging (default: 2). */
  slop?: number;
  /** Snap the segments to a grid of the specified multiples in seconds? */
  snapToGridInterval?: number;
  /** Shift the snap-to-grid by the specified seconds. May also be negative. */
  snapToGridOffset?: number;
  /** Maximum number of segments that may be created by the user at one time. */
  maxSegments?: number;
  /** Allows custom formating for segment tooltip. */
  formatTimeCallback?: (start: number, end: number) => string;
  /** from container edges' Optional width for edgeScroll to start (default: 5% of viewport width). */
  edgeScrollWidth?: number;
}

export class Segment extends Observer {
  constructor(
    params: SegmentParams,
    segmentsUtil: WaveSurfer["util"],
    ws: WaveSurfer,
  );

  bindDragEvents(): void;
  bindEvents(): void;
  bindInOut(): void;
  formatTime(start: number, end: number): string;
  getWidth(): number;
  onDrag(delta: number): void;
  onResize(delta: number, direction: "start" | "end"): void;
  play(start?: number): void;
  playLoop(start?: number): void;
  remove(): void;
  render(): void;
  setLoop(loop: boolean): void;
  update(params: SegmentParams, eventParams?: SegmentUpdatedEventParams): void;
  updateHandlesResize(resize: boolean): void;
  updateRender(): void;

  readonly attributes: Attributes;
  readonly color: string;
  readonly data: Datas;
  readonly edgeScrollWidth?: number;
  readonly element: HTMLElement;
  readonly end: number;
  readonly firedIn: boolean;
  readonly firedOut: boolean;
  readonly formatTimeCallback?: (start: number, end: number) => string;
  readonly handleLeftEl: HTMLElement | null;
  readonly handleRightEl: HTMLElement | null;
  readonly handleStyle: HandleStyle;
  readonly id: string;
  readonly isDragging: boolean;
  readonly isResizing: boolean;
  readonly loop: boolean;
  readonly marginTop: string;
  readonly preventContextMenu: boolean;
  readonly segmentHeight: string;
  readonly segmentsUtil: WaveSurfer["util"];
  readonly scroll: boolean;
  readonly scrollSpeed: number;
  readonly scrollThreshold: number;
  readonly start: number;
  readonly style: WaveSurfer["util"]["style"];
  readonly util: WaveSurfer["util"];
  readonly wavesurfer: WaveSurfer;
  readonly wrapper: HTMLElement;
}

export interface SegmentParams {
  id?: string;
  start?: number;
  end?: number;
  loop?: boolean;
  color?: string;
  channelIdx?: number;
  handleStyle?: HandleStyle;
  preventContextMenu?: boolean;
  showTooltip?: boolean;
  attributes?: Attributes;
  data?: Datas;
}

export interface SegmentUpdatedEventParams {
  action: "resize" | "contentEdited";
  direction?: "right" | "left" | null;
  oldText?: string;
  text?: string;
}

export interface HandleStyle {
  left: Styles;
  right: Styles;
}

export interface Attributes {
  [attributeName: string]: string;
}

export interface Datas {
  [dataName: string]: unknown;
}
