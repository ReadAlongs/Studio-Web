export class Segment {
  constructor(params, segmentsUtils, ws, prev, next) {
    this.wavesurfer = ws;
    this.wrapper = ws.drawer.wrapper;
    this.util = ws.util;
    this.style = this.util.style;
    this.segmentsUtil = segmentsUtils;
    this.vertical = ws.drawer.params.vertical;
    this.prev = prev;
    this.next = next;

    this.id = params.id == null ? ws.util.getId() : params.id;
    this.start = Number(params.start) || 0;
    this.end =
      params.end == null
        ? // small marker-like segment
          this.start +
          (4 / this.wrapper.scrollWidth) * this.wavesurfer.getDuration()
        : Number(params.end);
    this.contentEditable = Boolean(params.contentEditable);
    this.removeButton = Boolean(params.removeButton);
    // reflect resize state of segment for segment-updated listener
    this.isResizing = false;
    this.loop = Boolean(params.loop);
    this.color = params.color || "rgba(0, 0, 0, 0.1)";
    // The left and right handleStyle properties can be set to 'none' for
    // no styling or can be assigned an object containing CSS properties.
    this.handleStyle = params.handleStyle || {
      left: {},
      right: {},
    };
    this.handleLeftEl = null;
    this.handleRightEl = null;
    this.data = params.data || {};
    this.attributes = params.attributes || {};
    this.showTooltip = params.showTooltip ?? true;

    this._onRedraw = () => this.updateRender();

    this.scroll = params.scroll !== false && ws.params.scrollParent;
    this.scrollSpeed = params.scrollSpeed || 1;
    this.scrollThreshold = params.scrollThreshold || 10;
    // Determines whether the context menu is prevented from being opened.
    this.preventContextMenu =
      params.preventContextMenu === undefined
        ? false
        : Boolean(params.preventContextMenu);

    // select channel ID to set segment
    let channelIdx =
      params.channelIdx == null ? -1 : parseInt(params.channelIdx);
    this.channelIdx = channelIdx;
    this.segmentHeight = "100%";
    this.marginTop = "0px";

    if (channelIdx !== -1) {
      let channelCount =
        this.wavesurfer.backend.buffer != null
          ? this.wavesurfer.backend.buffer.numberOfChannels
          : -1;
      if (channelCount >= 0 && channelIdx < channelCount) {
        this.segmentHeight = Math.floor((1 / channelCount) * 100) + "%";
        this.marginTop = this.wavesurfer.getHeight() * channelIdx + "px";
      }
    }

    this.edgeScrollWidth = params.edgeScrollWidth;
    this.bindInOut();
    this.render();
    this.wavesurfer.on("zoom", this._onRedraw);
    this.wavesurfer.on("redraw", this._onRedraw);
    this.wavesurfer.fireEvent("segment-created", this);
  }

  /* Update segment params. */
  update(params, eventParams) {
    if (params.start != null) {
      this.start = Number(params.start);
    }
    if (params.end != null) {
      this.end = Number(params.end);
    }
    if (params.loop != null) {
      this.loop = Boolean(params.loop);
    }
    if (params.color != null) {
      this.color = params.color;
    }
    if (params.handleStyle != null) {
      this.handleStyle = params.handleStyle;
    }
    if (params.data != null) {
      this.data = params.data;
    }
    this.updateHandlesResize(true);
    if (params.attributes != null) {
      this.attributes = params.attributes;
    }

    this.updateRender();
    this.fireEvent("update");
    this.wavesurfer.fireEvent("segment-updated", this, eventParams);
  }

  /* Remove a single segment. */
  remove() {
    if (this.element) {
      this.element.remove();
      this.element = null;
      this.fireEvent("remove");
      this.wavesurfer.un("zoom", this._onRedraw);
      this.wavesurfer.un("redraw", this._onRedraw);
      this.wavesurfer.fireEvent("segment-removed", this);
    }
  }

  /**
   * Play the audio segment.
   * @param {number} start Optional offset to start playing at
   */
  play(start) {
    const s = start || this.start;
    this.wavesurfer.play(s, this.end);
    this.fireEvent("play");
    this.wavesurfer.fireEvent("segment-play", this);
  }

  /**
   * Play the audio segment in a loop.
   * @param {number} start Optional offset to start playing at
   * */
  playLoop(start) {
    this.loop = true;
    this.play(start);
  }

  /**
   * Set looping on/off.
   * @param {boolean} loop True if should play in loop
   */
  setLoop(loop) {
    this.loop = loop;
  }

  /* Render a segment as a DOM element. */
  render() {
    this.element = this.util.withOrientation(
      this.wrapper.appendChild(document.createElement("segment")),
      this.vertical,
    );

    this.element.className = "wavesurfer-segment";
    if (this.showTooltip) {
      this.element.title = this.formatTime(this.start, this.end);
    }
    this.element.setAttribute("data-id", this.id);

    for (const attrname in this.attributes) {
      this.element.setAttribute(
        "data-segment-" + attrname,
        this.attributes[attrname],
      );
    }

    this.style(this.element, {
      position: "absolute",
      zIndex: 3,
      height: this.segmentHeight,
      top: this.marginTop,
    });

    /* Button Remove Segment */
    if (this.removeButton) {
      const removeButtonEl = document.createElement("div");
      removeButtonEl.className = "remove-segment-button";
      removeButtonEl.textContent = "⨯";
      this.removeButtonEl = this.element.appendChild(removeButtonEl);
      const css = {
        zIndex: 4,
        position: "absolute",
        bottom: 0,
        right: "4px",
        cursor: "pointer",
        fontSize: "20px",
        lineHeight: "21px",
        color: "grey",
      };
      this.style(this.removeButtonEl, css);
    }

    /* Edit content */
    if (this.contentEditable) {
      const contentEl = document.createElement("div");
      contentEl.className = "segment-content";
      contentEl.contentEditable = "true";
      contentEl.innerHTML = this.data.text || "";
      this.contentEl = this.element.appendChild(contentEl);
      const css = {
        zIndex: 4,
        padding: "2px 5px",
        cursor: "text",
      };
      this.style(this.contentEl, css);
    }

    /* Resize handles */
    this.handleLeftEl = this.util.withOrientation(
      this.element.appendChild(document.createElement("handle")),
      this.vertical,
    );
    this.handleRightEl = this.util.withOrientation(
      this.element.appendChild(document.createElement("handle")),
      this.vertical,
    );

    this.handleLeftEl.className = "wavesurfer-handle wavesurfer-handle-start";
    this.handleRightEl.className = "wavesurfer-handle wavesurfer-handle-end";

    // Default CSS properties for both handles.
    const css = {
      cursor: this.vertical ? "row-resize" : "col-resize",
      position: "absolute",
      top: "0px",
      width: "2px",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 1)",
    };

    // Merge CSS properties per handle.
    const handleLeftCss =
      this.handleStyle.left !== "none"
        ? Object.assign({ left: "0px" }, css, this.handleStyle.left)
        : null;
    const handleRightCss =
      this.handleStyle.right !== "none"
        ? Object.assign({ right: "0px" }, css, this.handleStyle.right)
        : null;

    if (handleLeftCss) {
      this.style(this.handleLeftEl, handleLeftCss);
    }

    if (handleRightCss) {
      this.style(this.handleRightEl, handleRightCss);
    }

    this.updateRender();
    this.bindEvents();
  }

  formatTime(start, end) {
    // They are in milliseconds
    return `${start.toFixed(3)}-${end.toFixed(3)}`;
  }

  getWidth() {
    return this.wavesurfer.drawer.width / this.wavesurfer.params.pixelRatio;
  }

  /* Update element's position, width, color. */
  updateRender() {
    // duration varies during loading process, so don't overwrite important data
    const dur = this.wavesurfer.getDuration();
    const width = this.getWidth();

    // Restrict to endpoints of waveform
    let startLimited = Math.max(this.start, 0);
    let endLimited = Math.min(this.end, dur);
    // end must be >= start
    endLimited = Math.max(startLimited, endLimited);

    if (this.element != null) {
      // Calculate the left and width values of the segment such that
      // no gaps appear between segments.
      const left = Math.round((startLimited / dur) * width);
      const segmentWidth = Math.round((endLimited / dur) * width) - left;

      this.style(this.element, {
        left: left + "px",
        width: segmentWidth + "px",
        backgroundColor: this.color,
        cursor: "default",
      });

      for (const attrname in this.attributes) {
        this.element.setAttribute(
          "data-segment-" + attrname,
          this.attributes[attrname],
        );
      }

      if (this.showTooltip) {
        this.element.title = this.formatTime(this.start, this.end);
      }
    }
  }

  /* Bind audio events. */
  bindInOut() {
    this.firedIn = false;
    this.firedOut = false;

    const onProcess = (time) => {
      let start = Math.round(this.start * 10) / 10;
      let end = Math.round(this.end * 10) / 10;
      time = Math.round(time * 10) / 10;

      if (!this.firedOut && this.firedIn && (start > time || end <= time)) {
        this.firedOut = true;
        this.firedIn = false;
        this.fireEvent("out");
        this.wavesurfer.fireEvent("segment-out", this);
      }
      if (!this.firedIn && start <= time && end > time) {
        this.firedIn = true;
        this.firedOut = false;
        this.fireEvent("in");
        this.wavesurfer.fireEvent("segment-in", this);
      }
    };

    this.wavesurfer.backend.on("audioprocess", onProcess);

    this.on("remove", () => {
      this.wavesurfer.backend.un("audioprocess", onProcess);
    });

    /* Loop playback. */
    this.on("out", () => {
      if (this.loop) {
        const realTime = this.wavesurfer.getCurrentTime();
        if (realTime >= this.start && realTime <= this.end) {
          this.wavesurfer.play(this.start);
        }
      }
    });
  }

  /* Bind DOM events. */
  bindEvents() {
    const preventContextMenu = this.preventContextMenu;

    this.element.addEventListener("mouseenter", (e) => {
      this.fireEvent("mouseenter", e);
      this.wavesurfer.fireEvent("segment-mouseenter", this, e);
    });

    this.element.addEventListener("mouseleave", (e) => {
      this.fireEvent("mouseleave", e);
      this.wavesurfer.fireEvent("segment-mouseleave", this, e);
    });

    this.element.addEventListener("click", (e) => {
      e.preventDefault();
      this.fireEvent("click", e);
      this.wavesurfer.fireEvent("segment-click", this, e);
    });

    this.element.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.fireEvent("dblclick", e);
      this.wavesurfer.fireEvent("segment-dblclick", this, e);
    });

    this.element.addEventListener("contextmenu", (e) => {
      if (preventContextMenu) {
        e.preventDefault();
      }
      this.fireEvent("contextmenu", e);
      this.wavesurfer.fireEvent("segment-contextmenu", this, e);
    });

    /* Resize on mousemove. */
    this.bindDragEvents();

    /* Edit content */
    if (this.contentEditable) {
      this.contentEl.addEventListener("blur", this.onContentBlur.bind(this));
      this.contentEl.addEventListener("click", this.onContentClick.bind(this));
    }
    /* Remove button */
    if (this.removeButton) {
      this.removeButtonEl.addEventListener("click", this.onRemove.bind(this));
    }
  }

  bindDragEvents() {
    const container = this.wavesurfer.drawer.container;
    const scrollSpeed = this.scrollSpeed;
    let startTime;
    let touchId;
    let maxScroll;
    let resize;
    let updated = false;
    let scrollDirection;
    let wrapperRect;

    // Determine allowable resize and effect on adjacent segment
    const adjustTime = (event) => {
      const duration = this.wavesurfer.getDuration();
      let time = this.wavesurfer.drawer.handleEvent(event) * duration;

      // First clamp it to the absolute limits of the waveform
      time = Math.max(time, 0);
      time = Math.min(time, duration);

      // If this segment is linked, adjust the linked segment.
      // Disallow overlapping accordingly (either the current
      // segment or the adjacent one)
      let adj;
      let overlap_src = this;
      if (resize == "end") {
        time = Math.max(this.start, time);
        if (this.next) {
          adj = this.wavesurfer.segments.list[this.next];
          overlap_src = adj;
          time = Math.min(adj.end, time);
        }
        for (const segment of Object.values(this.wavesurfer.segments.list)) {
          if (segment === overlap_src) continue;
          if (overlap_src.start < segment.start && time > segment.start)
            time = segment.start;
        }
      } else if (resize == "start") {
        time = Math.min(this.end, time);
        if (this.prev) {
          adj = this.wavesurfer.segments.list[this.prev];
          overlap_src = adj;
          time = Math.max(adj.start, time);
        }
        for (const segment of Object.values(this.wavesurfer.segments.list)) {
          if (segment === overlap_src) continue;
          if (overlap_src.end > segment.end && time < segment.end)
            time = segment.end;
        }
      }
      return [time, adj];
    };

    // Scroll when the user is dragging within the threshold
    const edgeScroll = (event) => {
      let orientedEvent = this.util.withOrientation(event, this.vertical);
      const duration = this.wavesurfer.getDuration();
      if (!scrollDirection) {
        return;
      }

      const x = orientedEvent.clientX;
      let distanceBetweenCursorAndWrapperEdge = 0;
      let segmentHalfTimeWidth = 0;
      let adjustment = 0;

      // Get the currently selected time according to the mouse position
      let [time, adj] = adjustTime(event);

      // Don't edgescroll if segment has reached min or max limit
      const wrapperScrollLeft = this.wrapper.scrollLeft;

      if (scrollDirection === -1) {
        if (Math.round(wrapperScrollLeft) === 0) {
          return;
        }

        if (
          Math.round(
            wrapperScrollLeft -
              segmentHalfTimeWidth +
              distanceBetweenCursorAndWrapperEdge,
          ) <= 0
        ) {
          return;
        }
      } else {
        if (Math.round(wrapperScrollLeft) === maxScroll) {
          return;
        }

        if (
          Math.round(
            wrapperScrollLeft +
              segmentHalfTimeWidth -
              distanceBetweenCursorAndWrapperEdge,
          ) >= maxScroll
        ) {
          return;
        }
      }

      // Update scroll position
      let scrollLeft =
        wrapperScrollLeft - adjustment + scrollSpeed * scrollDirection;

      if (scrollDirection === -1) {
        const calculatedLeft = Math.max(
          0 + segmentHalfTimeWidth - distanceBetweenCursorAndWrapperEdge,
          scrollLeft,
        );
        this.wrapper.scrollLeft = scrollLeft = calculatedLeft;
      } else {
        const calculatedRight = Math.min(
          maxScroll -
            segmentHalfTimeWidth +
            distanceBetweenCursorAndWrapperEdge,
          scrollLeft,
        );
        this.wrapper.scrollLeft = scrollLeft = calculatedRight;
      }

      const delta = time - startTime;
      startTime = time;

      // Continue dragging or resizing
      this.onResize(delta, resize);
      if (adj) adj.onResize(delta, resize == "start" ? "end" : "start");

      // Repeat
      window.requestAnimationFrame(() => {
        edgeScroll(event);
      });
    };

    const onDown = (event) => {
      const duration = this.wavesurfer.getDuration();
      // Exclude multi-touch events
      if (event.touches && event.touches.length > 1) {
        return;
      }
      // Store touch target for comparison
      touchId = event.targetTouches ? event.targetTouches[0].identifier : null;

      // stop the event propagation, we got this
      event.stopPropagation();

      // Store the selected startTime we begun resizing
      startTime = this.wavesurfer.drawer.handleEvent(event, true) * duration;

      // Store for scroll calculations
      maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;

      wrapperRect = this.util.withOrientation(
        this.wrapper.getBoundingClientRect(),
        this.vertical,
      );

      this.isResizing = false;
      if (event.target.tagName.toLowerCase() === "handle") {
        this.isResizing = true;
        // Which side are we resizing
        resize = event.target.classList.contains("wavesurfer-handle-start")
          ? "start"
          : "end";
      }
    };
    const onUp = (event) => {
      // Exclude multi-touches
      if (event.touches && event.touches.length > 1) {
        return;
      }

      // End a resize in progress
      if (resize) {
        this.isResizing = false;
        scrollDirection = null;
        resize = false;
      }

      // Update this segment if necessary
      if (updated) {
        updated = false;
        this.util.preventClick();
        this.fireEvent("update-end", event);
        this.wavesurfer.fireEvent("segment-update-end", this, event);
      }
    };
    const onMove = (event) => {
      // Total duration which cannot be exceeded!
      const duration = this.wavesurfer.getDuration();
      let orientedEvent = this.util.withOrientation(event, this.vertical);

      // Exclude multi-touches
      if (event.touches && event.touches.length > 1) {
        return;
      }
      // Exclude touches on other targets than the original one
      if (event.targetTouches && event.targetTouches[0].identifier != touchId) {
        return;
      }
      // We only care about moves when resizing
      if (!resize) return;

      // Decide whether we will actually resize or not, and if
      // we should also adjust an adjacent segment.
      let [time, adj] = adjustTime(event);

      const delta = time - startTime;
      startTime = time;

      // Signal an updated event if we were already updated or
      // if there is a change to report
      updated = updated || delta !== 0;
      this.onResize(delta, resize);
      if (adj) adj.onResize(delta, resize == "start" ? "end" : "start");

      // Complicated edge-scrolling logic
      if (this.scroll && container.clientWidth < this.wrapper.scrollWidth) {
        // Triggering edgescroll from within edgeScrollWidth
        let x = orientedEvent.clientX;

        // Check direction
        if (x < wrapperRect.left + this.edgeScrollWidth) {
          scrollDirection = -1;
        } else if (x > wrapperRect.right - this.edgeScrollWidth) {
          scrollDirection = 1;
        } else {
          scrollDirection = null;
        }

        if (scrollDirection) {
          edgeScroll(event);
        }
      }
    };

    this.element.addEventListener("mousedown", onDown);
    this.element.addEventListener("touchstart", onDown);

    document.body.addEventListener("mousemove", onMove);
    document.body.addEventListener("touchmove", onMove, { passive: false });

    document.addEventListener("mouseup", onUp);
    document.body.addEventListener("touchend", onUp);

    this.on("remove", () => {
      document.removeEventListener("mouseup", onUp);
      document.body.removeEventListener("touchend", onUp);
      document.body.removeEventListener("mousemove", onMove);
      document.body.removeEventListener("touchmove", onMove);
    });

    this.wavesurfer.on("destroy", () => {
      document.removeEventListener("mouseup", onUp);
      document.body.removeEventListener("touchend", onUp);
    });
  }

  /**
   * @example
   * onResize(-5, 'start') // Moves the start point 5 seconds back
   * onResize(0.5, 'end') // Moves the end point 0.5 seconds forward
   *
   * @param {number} delta How much to add or subtract, given in seconds
   * @param {string} direction 'start 'or 'end'
   */
  onResize(delta, direction) {
    const duration = this.wavesurfer.getDuration();
    const eventParams = {
      action: "resize",
      direction: direction === "start" ? "left" : "right",
    };

    if (direction === "start") {
      if (delta < 0 && this.start + delta < 0) {
        delta = this.start * -1;
      }

      this.update(
        {
          start: Math.min(this.start + delta, this.end),
          end: Math.max(this.start + delta, this.end),
        },
        eventParams,
      );
    } else {
      if (delta > 0 && this.end + delta > duration) {
        delta = duration - this.end;
      }

      this.update(
        {
          start: Math.min(this.end + delta, this.start),
          end: Math.max(this.end + delta, this.start),
        },
        eventParams,
      );
    }
  }

  onContentBlur(event) {
    const { text: oldText } = this.data || {};
    const text = event.target.innerText;
    const data = { ...this.data, text };
    const eventParams = { action: "contentEdited", oldText, text };
    this.update({ data }, eventParams);
  }

  onContentClick(event) {
    event.stopPropagation();
  }

  onRemove(event) {
    event.stopPropagation();
    this.remove();
  }

  updateHandlesResize(resize) {
    let cursorStyle;
    if (resize) {
      cursorStyle = this.vertical ? "row-resize" : "col-resize";
    } else {
      cursorStyle = "auto";
    }

    this.handleLeftEl && this.style(this.handleLeftEl, { cursor: cursorStyle });
    this.handleRightEl &&
      this.style(this.handleRightEl, { cursor: cursorStyle });
  }
}
