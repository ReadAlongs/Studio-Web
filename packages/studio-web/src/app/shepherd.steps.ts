import { title } from "process";
import { environment } from "../environments/environment";
import { text } from "stream/consumers";
import Tour from "shepherd.js/src/types/tour";
import Shepherd from "shepherd.js";

export const intro_step: any = {
  title: $localize`Welcome to ReadAlong Studio`,
  text: $localize`Creating a ReadAlong is easy!\
    This guide will show you all the bells and whistles of the Studio.`,
  attachTo: {
    element: "#welcome-header",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "intro",
};

export const data_step: any = {
  title: $localize`Adding your data`,
  text: $localize`To make your ReadAlong, you'll need to add your text and audio.`,
  attachTo: {
    element: "#upload-header",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "data",
};

export const text_write_step: any = {
  title: $localize`Write your text`,
  text: $localize`You can write your text directly into ReadAlong Studio, by selecting the "write" option.`,
  attachTo: {
    element: "#text-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "text-write",
};

export const text_file_step: any = {
  title: $localize`Use a text file`,
  text: $localize`You can also use text from a plain text file (.txt) or a file in the RAS format (.readalong).`,
  attachTo: {
    element: "#text-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "text-file",
};

export const audio_record_step: any = {
  title: $localize`Record your own audio`,
  text: $localize`You can record your own audio for preprocessing using your browser's microphone.`,
  attachTo: {
    element: "#audio-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "audio-record",
};

export const audio_file_step: any = {
  title: $localize`Use an audio file`,
  text: $localize`You can also select either a .wav or .mp3 file for your ReadAlong.`,
  attachTo: {
    element: "#audio-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "audio-file",
};

export const language_step: any = {
  title: $localize`Select your language`,
  text: $localize`Then, optionally, you can select the language of your ReadAlong.`,
  attachTo: {
    element: "#language-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "language",
};

export const generic_language_step: any = {
  title: $localize`Select your language`,
  text: $localize`For most users, the default settings here are appropriate, and you don't need to do anything else - just keep this option selected!`,
  attachTo: {
    element: "#generic-language",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "generic-language",
};

export const specific_language_step: any = {
  title: $localize`Select your language`,
  text: $localize`However, if your results aren't good enough with the default settings you can choose your language from this list. If it's not supported already, have a look at
  <a href="https://blog.mothertongues.org/g2p-background/" target="_blank" rel="noopener noreferrer" >
    this blog post series</a
  >
  to understand how you might get support for your language, or
  <a href="${environment.packageJson.contact}"
    >
    contact us</a
  >
  for more info!`,
  attachTo: {
    element: "#specific-language",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "specific-language",
};

export const step_one_final_step: any = {
  title: $localize`That's it!`,
  text: $localize`Once you've done this, you can click the "next step" button here to let Studio build your ReadAlong! (This may take a few seconds.)`,
  attachTo: {
    element: "#next-step",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
    },
  ],
  id: "create-readalong",
};

export const step_two_intro_step: any = {
  title: $localize`Tadaa!`,
  text: $localize`Now your ReadAlong has been created.`,
  attachTo: {
    element: "#readalong",
    on: "top",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "step-two-intro",
};

export const readalong_play_step: any = {
  title: $localize`Play your ReadAlong`,
  text: $localize`Pressing play will play the audio and highlight the text at the same time. Try it out!`,
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "readalong-play",
};

export const readalong_play_word_step: any = {
  title: $localize`Play your ReadAlong`,
  text: $localize`Clicking on an individual word will play it as well.`,
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "readalong-play-word",
};

export const readalong_change_title_step: any = {
  title: $localize`Edit your ReadAlong`,
  text: $localize`You can edit the text here to add a Title or Subtitle to your ReadAlong.`,
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "readalong-change-title",
};

export const readalong_add_image_step: any = {
  title: $localize`Edit your ReadAlong`,
  text: $localize`You can add an image to each page of your ReadAlong here.`,
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "readalong-add-image",
};

export const readalong_add_translation_step: any = {
  title: $localize`Edit your ReadAlong`,
  text: $localize`You can add a translation or extra bit of information to each sentence of your ReadAlong by clicking on the + icon here. If you later want to remove the translation, click on the 🗑️ icon after adding your translation.`,
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "readalong-add-translation",
};

export const readalong_export_step: any = {
  title: $localize`Export your ReadAlong`,
  text:
    $localize`When you're happy with your ReadAlong, you can export it by selecting a download format and then clicking on the download button (down arrow). You can choose from the following formats: ` +
    "<ul><li>" +
    $localize`<b>Offline HTML</b>: your ReadAlongs in a single-file HTML document that requires no web access to work,` +
    "</li><li>" +
    $localize`<b>Web Bundle</b>: all your ReadAlong files in a folder that can be hosted on a web server,` +
    "</li><li>" +
    $localize`<b>Elan and Praat files</b>: export formats used by documentary linguists,` +
    "</li><li>" +
    $localize`<b>SRT and WebVTT subtitles</b>: export formats used to add subtitles to videos.` +
    "</li></ul>",
  attachTo: {
    element: "div.download__buttons",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "readalong-export",
};

export const readalong_go_back_step: any = {
  title: $localize`Edit your ReadAlong inputs`,
  text:
    $localize`If you'd like to change your audio or text you can always go back to Step 1 and change things or make a new ReadAlong. ` +
    $localize`But be careful, going back to the previous step will mean you will lose all of your translations and images.` +
    "<br/><br/>" +
    $localize`Warning: Using the browser's back button will leave the app and might also erase all your text and audio data, so it should be avoided. ` +
    $localize`Instead, use the "Step 1" button to go back and change your text or audio.`,
  attachTo: {
    // TODO: find an anchor that doesn't depend on Angular innards
    // We want this as under the "Step 1" icon but we can't add any id to that since it's generated
    element: "div.mat-horizontal-stepper-header-container",
    on: "botton-start",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-warning",
      text: $localize`Editor`,
      action: function () {
        if (this) (this as unknown as Tour).complete();
        window.location.hash = "#/editor?startTour=yes";
      },
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Finish`,
      type: "cancel",
    },
  ],
  id: "readalong-back",
};

export const readalong_editor_intro: any = {
  title: $localize`Editor for your exported ReadAlong`,
  text: $localize`This tool allows you to modify your exported ReadAlong. Note that this tool only accepts the Offline HTML format.`,
  attachTo: {
    element: "#editor",
    on: "bottom-center",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
};

export const readalong_editor_choose_file: any = {
  title: $localize`Choose File`,
  text: $localize`Select an offline HTML ReadAlong file. Or, you can use the Offline-HTML file  included in the Web Bundle download format. For the purposes of the tour, we'll add an example readalong for you.`,
  attachTo: {
    element: "#updateRAS",
    on: "bottom-middle",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-warning",
      text: $localize`Next`,
    },
  ],
};

export const readalong_editor_file_loaded: any = {
  title: $localize`Tadaa!`,
  text: $localize`Now your ReadAlong has been loaded.`,
  attachTo: {
    element: "#readalongContainer",
    on: "top",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
};

export const readalong_editor_audio_toolbar: any = {
  title: $localize`Audio Toolbar`,
  text: $localize`In this section, you can see a visual representation of your audio and text alignment. You can adjust your audio-text alignments and fix spelling errors here. Click 'next' to see how.`,
  attachTo: {
    element: "#audioToolbar",
    on: "top",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
};

export const readalong_editor_audio_toolbar_zoom: any = {
  title: $localize`Audio Toolbar Zoom`,
  text: $localize`Use the zoom controls in this section to zoom in on the visualization of your audio.`,
  attachTo: {
    element: "#zoomControls",
    on: "top-end",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
};

export const readalong_editor_audio_wav: any = {
  title: $localize`Audio Text Alignment Visualization`,
  text: $localize`This is a visual representation of the audio-to-text alignment in your read-along. You can click on the wave form of a word to hear it, and drag the bars at the word boundaries to adjust its alignment. Please click on the play button above to see how adjusting the word boundaries affects the highlighting of your readalong.`,
  attachTo: {
    element: "#wavesurferContainer",
    on: "top",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
};
export const readalong_editor_fix_text: any = {
  title: $localize`Fix Spelling Errors`,
  text: $localize`You can also fix spelling errors by clicking on a word and editing it.`,
  attachTo: {
    element: "#wavesurferContainer",
    on: "left",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
};
export const readalong_add_annotations_step: any = {
  title: $localize`Annotating your ReadAlong`,
  text: $localize`If you need to add information tiers/layers/annotation to each sentence of your ReadAlong, define the tiers by clicking on the icon here. If you later want to remove the tier, click on the 🗑️ icon after you have deleted all data in that tier.`,
  attachTo: {
    element: "#toggleAnnotations",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: $localize`Back`,
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: $localize`Next`,
      type: "next",
    },
  ],
  id: "readalong-add-annotation",
};
