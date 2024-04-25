import { Segment } from "./segment.js";

export default class SegmentsPlugin {
  /**
   * Segments plugin definition factory
   *
   * This function must be used to create a plugin definition which can be
   * used by wavesurfer to correctly instantiate the plugin.
   *
   * @param {SegmentsPluginParams} params parameters use to initialise the plugin
   * @return {PluginDefinition} an object representing the plugin
   */
  static create(params) {
    return {
      name: "segments",
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      staticProps: {
        addSegment(options) {
          if (!this.initialisedPluginList.segments) {
            this.initPlugin("segments");
          }
          return this.segments.add(options);
        },

        clearSegments() {
          this.segments && this.segments.clear();
        },
      },
      instance: SegmentsPlugin,
    };
  }

  constructor(params, ws) {
    this.params = params;
    this.wavesurfer = ws;
    this.util = ws.util;

    // turn the plugin instance into an observer
    const observerPrototypeKeys = Object.getOwnPropertyNames(
      this.util.Observer.prototype,
    );
    observerPrototypeKeys.forEach((key) => {
      Segment.prototype[key] = this.util.Observer.prototype[key];
    });
    this.wavesurfer.Segment = Segment;

    // By default, scroll the container if the user drags a segment
    // within 5% (based on its initial size) of its edge
    const scrollWidthProportion = 0.05;
    this._onBackendCreated = () => {
      this.wrapper = this.wavesurfer.drawer.wrapper;
      this.orientation = this.wavesurfer.drawer.orientation;
      this.defaultEdgeScrollWidth =
        this.wrapper.clientWidth * scrollWidthProportion;
      if (this.params.segments) {
        this.params.segments.forEach((segment) => {
          this.add(segment);
        });
      }
    };

    // Id-based hash of segments
    this.list = {};
    this._onReady = () => {
      this.wrapper = this.wavesurfer.drawer.wrapper;
      this.vertical = this.wavesurfer.drawer.params.vertical;
      Object.keys(this.list).forEach((id) => {
        this.list[id].updateRender();
      });
    };
  }

  init() {
    // Check if ws is ready
    if (this.wavesurfer.isReady) {
      this._onBackendCreated();
      this._onReady();
    } else {
      this.wavesurfer.once("ready", this._onReady);
      this.wavesurfer.once("backend-created", this._onBackendCreated);
    }
  }

  destroy() {
    this.wavesurfer.un("ready", this._onReady);
    this.wavesurfer.un("backend-created", this._onBackendCreated);
    // Disabling `segment-removed' because destroying the plugin calls
    // the Segment.remove() method that is also used to remove segments based
    // on user input. This can cause confusion since teardown is not a
    // user event, but would emit `segment-removed` as if it was.
    this.wavesurfer.setDisabledEventEmissions(["segment-removed"]);
    this.clear();
  }

  /**
   * Add a segment
   *
   * @param {object} params Segment parameters
   * @return {Segment} The created segment
   */
  add(params) {
    params = {
      edgeScrollWidth:
        this.params.edgeScrollWidth || this.defaultEdgeScrollWidth,
      contentEditable: this.params.contentEditable,
      removeButton: this.params.removeButton,
      ...params,
    };

    // Round times to milliseconds (this is somewhat bogus, but
    // allows us to reason sensibly about adjacency below)
    params.start = Math.round(params.start * 1000) / 1000;
    params.end = Math.round(params.end * 1000) / 1000;

    // Simulate a linked list
    let prev;
    let next;
    const dur = this.wavesurfer.getDuration();
    for (const adj of Object.values(this.list)) {
      if (adj.end === params.start) prev = adj.id;
      if (adj.start === params.end) next = adj.id;
    }
    const segment = new this.wavesurfer.Segment(
      params,
      this.util,
      this.wavesurfer,
      prev,
      next,
    );

    this.list[segment.id] = segment;
    if (prev) this.list[prev].next = segment.id;
    if (next) this.list[next].prev = segment.id;

    segment.on("remove", () => {
      if (segment.prev) delete this.list[segment.prev].next;
      if (segment.next) delete this.list[segment.next].prev;
      delete this.list[segment.id];
    });

    return segment;
  }

  /**
   * Remove all segments
   */
  clear() {
    Object.keys(this.list).forEach((id) => {
      this.list[id].remove();
    });
  }

  /**
   * Get current segment
   *
   * The smallest segment that contains the current time. If several such
   * segments exist, take the first. Return `null` if none exist.
   *
   * @returns {Segment} The current segment
   */
  getCurrentSegment() {
    const time = this.wavesurfer.getCurrentTime();
    let min = null;
    Object.keys(this.list).forEach((id) => {
      const cur = this.list[id];
      if (cur.start <= time && cur.end >= time) {
        if (!min || cur.end - cur.start < min.end - min.start) {
          min = cur;
        }
      }
    });

    return min;
  }
}
