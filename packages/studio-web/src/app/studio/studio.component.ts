import { ShepherdService } from "../shepherd.service";
import { forkJoin, of, BehaviorSubject, Subject, take, takeUntil } from "rxjs";
import { Segment } from "soundswallower";

import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Meta } from "@angular/platform-browser";
import { MatStepper } from "@angular/material/stepper";
import { Title } from "@angular/platform-browser";

import {
  createAlignedXML,
  SoundswallowerService,
} from "../soundswallower.service";
import { FileService } from "../file.service";
import {
  audio_file_step,
  audio_record_step,
  data_step,
  step_one_final_step,
  step_two_intro_step,
  intro_step,
  language_step,
  specific_language_step,
  generic_language_step,
  readalong_play_step,
  readalong_play_word_step,
  readalong_add_image_step,
  readalong_add_translation_step,
  readalong_change_title_step,
  readalong_export_step,
  readalong_go_back_step,
  text_file_step,
  text_write_step,
  readalong_go_to_editor,
} from "../shepherd.steps";
import { DemoComponent } from "../demo/demo.component";
import { UploadComponent } from "../upload/upload.component";
import { StepperSelectionEvent } from "@angular/cdk/stepper";
import { HttpErrorResponse } from "@angular/common/http";
import { DownloadService } from "../shared/download/download.service";
import { StudioService } from "./studio.service";

@Component({
  selector: "studio-component",
  templateUrl: "./studio.component.html",
  styleUrls: ["./studio.component.sass"],
  standalone: false,
})
export class StudioComponent implements OnDestroy, OnInit {
  title = "readalong-studio";
  @ViewChild("upload", { static: false }) upload?: UploadComponent;
  @ViewChild("demo", { static: false }) demo?: DemoComponent;
  @ViewChild("stepper") private stepper: MatStepper;
  unsubscribe$ = new Subject<void>();
  private route: ActivatedRoute;
  constructor(
    private titleService: Title,
    private downloadService: DownloadService,
    public studioService: StudioService,
    private router: Router,
    private fileService: FileService,
    private meta: Meta,
    public shepherdService: ShepherdService,
    private ssjsService: SoundswallowerService,
  ) {}
  ngOnInit(): void {
    // Set Meta Tags for search engines and social media
    // We don't have to set charset or viewport for example since Angular already adds them
    this.titleService.setTitle(
      $localize`ReadAlong-Studio for Interactive Storytelling`,
    );
    this.meta.addTags(
      [
        // Search Engine Tags
        {
          name: "title",
          content: $localize`ReadAlong-Studio for Interactive Storytelling`,
        },
        {
          name: "description",
          content: $localize`Create your own offline compatible interactive multimedia stories that highlight words as they are spoken.`,
        },
        { name: "robots", content: "index,follow" },
        // Social Media Tags
        {
          name: "og:title",
          content: $localize`ReadAlong-Studio for Interactive Storytelling`,
        },
        {
          name: "og:description",
          content: $localize`Create your own offline compatible interactive multimedia stories that highlight words as they are spoken.`,
        },
        // These will break if we add routing!
        {
          name: "og:image",
          content: new URL("assets/demo.png", window.location.href).href,
        },
        { name: "og:url", content: window.location.href },
        { name: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:image:alt",
          content: $localize`Interactive ReadAlong that highlights text as it is spoken`,
        },
      ],
      true,
    );

    // User Browser's default messaging to warn the user when they're about to leave the page
    window.addEventListener("beforeunload", (e) => {
      if (this.formIsDirty()) (e || window.event).returnValue = true;
      return true;
    });
    // Catch and report a catastrophic failure as soon as possible
    this.ssjsService
      .loadModule$()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        error: (err) => {
          this.router.navigate(["error"], {
            relativeTo: this.route,
            queryParams: { msg: err.message, errorType: "aligner" },
            skipLocationChange: true,
          });
          console.log(err);
        },
      });
  }

  async ngOnDestroy() {
    // step us back to the previously left step
    this.studioService.lastStepperIndex = this.stepper.selectedIndex;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  selectionChange(event: StepperSelectionEvent) {
    if (event.selectedIndex === 0) {
      this.studioService.render$.next(false);
    } else if (event.selectedIndex === 1) {
      this.studioService.render$.next(true);
    }
  }

  ngAfterViewInit() {
    if (this.stepper.selectedIndex < this.studioService.lastStepperIndex) {
      this.stepper.next();
    }
  }

  formIsDirty() {
    return (
      this.studioService.audioControl$.value !== null ||
      this.studioService.textControl$.value !== null ||
      this.studioService.$textInput
    );
  }

  startTour(): void {
    this.shepherdService.defaultStepOptions = {
      classes: "",
      scrollTo: true,
      cancelIcon: {
        enabled: true,
      },
    };
    this.shepherdService.keyboardNavigation = false;
    text_file_step["when"] = {
      show: () => {
        if (this.upload) {
          this.studioService.inputMethod.text = "upload";
        }
      },
      hide: () => {
        if (this.upload) {
          this.studioService.inputMethod.text = "edit";
        }
      },
    };
    audio_file_step["when"] = {
      show: () => {
        if (this.upload) {
          this.studioService.inputMethod.audio = "upload";
        }
      },
      hide: () => {
        if (this.upload) {
          this.studioService.inputMethod.audio = "mic";
        }
      },
    };
    if (this.formIsDirty()) {
      step_one_final_step["text"] =
        $localize`Once you've done this, you can click the "next step" button here to let Studio build your ReadAlong! (This may take a few seconds.)` +
        $localize` You already started some work, though, so clicking next will erase it and continue the tour with demonstration data. Cancel the tour if you don't want to do this.`;
      step_one_final_step["buttons"][1]["text"] =
        $localize`Next` + " " + $localize`(overwrites your data)`;
      step_one_final_step["buttons"][1]["classes"] = "shepherd-button-warning";
    }

    step_one_final_step["buttons"][1]["action"] = () => {
      this.fileService
        .returnFileFromPath$("assets/hello-world.mp3")
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((audioFile) => {
          if (!(audioFile instanceof HttpErrorResponse) && this.upload) {
            this.studioService.$textInput.next("Hello world!");
            this.studioService.inputMethod.text = "edit";
            this.studioService.audioControl$.setValue(audioFile);
            this.upload?.nextStep();
            this.stepper.animationDone.pipe(take(1)).subscribe(() => {
              // We can only attach to the shadow dom once it's been created, so unfortunately we need to define the steps like this.
              readalong_play_step["attachTo"] = {
                element: document
                  .querySelector("#readalong")
                  ?.shadowRoot?.querySelector(
                    "div.control-panel__buttons--left",
                  ),
                on: "top",
              };
              readalong_play_word_step["attachTo"] = {
                element: document
                  .querySelector("#readalong")
                  ?.shadowRoot?.querySelector("#t0b0d0p0s0w0"),
                on: "bottom",
              };
              readalong_add_image_step["attachTo"] = {
                element: document
                  .querySelector("#readalong")
                  ?.shadowRoot?.querySelector("div.drop-area"),
                on: "bottom",
              };
              readalong_add_translation_step["attachTo"] = {
                element: document
                  .querySelector("#readalong")
                  ?.shadowRoot?.querySelector("div.sentence"),
                on: "bottom",
              };
              readalong_change_title_step["attachTo"] = {
                element: document
                  .querySelector("#readalong")
                  ?.shadowRoot?.querySelector("#title__slot__container"),
                on: "bottom",
              };

              this.shepherdService.next();
              // Strangely, adding steps actually removes all previous steps so we need to start the tour again here.
              this.shepherdService.addSteps([
                step_two_intro_step,
                readalong_play_step,
                readalong_play_word_step,
                readalong_change_title_step,
                readalong_add_image_step,
                readalong_add_translation_step,
                readalong_export_step,
                readalong_go_back_step,
                readalong_go_to_editor,
              ]);
              this.shepherdService.start();
            });
          } else {
            this.shepherdService.cancel();
          }
        });
    };

    this.shepherdService.modal = true;
    this.shepherdService.confirmCancel = false;
    // Add initial steps for part one of the tour, other steps are added later
    // once the Web-Component is added to the DOM.
    this.shepherdService.addSteps([
      intro_step,
      data_step,
      text_write_step,
      text_file_step,
      audio_record_step,
      audio_file_step,
      language_step,
      generic_language_step,
      specific_language_step,
      step_one_final_step,
    ]);
    this.shepherdService.start();
  }

  stepChange(event: any[]) {
    if (event[0] === "aligned") {
      const aligned_xml = createAlignedXML(event[2], event[3] as Segment);
      forkJoin([
        this.fileService.readFileAsData$(event[1]), // audio
        of(aligned_xml),
      ])
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((x: any) => {
          this.studioService.b64Inputs$.next(x);
          this.stepper.next();
        });
    }
  }
}
