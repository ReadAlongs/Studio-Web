export const intro_step: any = {
  title: "Welcome to ReadAlong Studio\n",
  text: `Creating a ReadAlong is easy!\
    This guide will show you all the bells and whistles of the Studio.`,
  attachTo: {
    element: "#welcome-header",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: "Next",
      type: "next",
    },
  ],
  id: "intro",
};

export const data_step: any = {
  title: "Adding your data\n",
  text: `To make your ReadAlong, you'll need to add your text and audio.`,
  attachTo: {
    element: "#upload-header",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: "Back",
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: "Next",
      type: "next",
    },
  ],
  id: "data",
};

export const text_write_step: any = {
  title: "Write your text\n",
  text: `You can write your text directly into ReadAlong Studio, by selecting the "write" option.`,
  attachTo: {
    element: "#text-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: "Back",
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: "Next",
      type: "next",
    },
  ],
  id: "text-write",
};

export const text_file_step: any = {
  title: "Upload your text\n",
  text: `You can also upload your text either as a plain text file (.txt) or in the RAS format (.ras).`,
  attachTo: {
    element: "#text-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: "Back",
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: "Next",
      type: "next",
    },
  ],
  id: "text-file",
};

export const audio_record_step: any = {
  title: "Record your own audio\n",
  text: `You can record your own audio for preprocessing using your browser's microphone.`,
  attachTo: {
    element: "#audio-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: "Back",
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: "Next",
      type: "next",
    },
  ],
  id: "audio-record",
};

export const audio_file_step: any = {
  title: "Use an audio file\n",
  text: `You can also select either a .wav or .mp3 file for your ReadAlong.`,
  attachTo: {
    element: "#audio-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: "Back",
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: "Next",
      type: "next",
    },
  ],
  id: "audio-file",
};

export const language_step: any = {
  title: "Select your language\n",
  text: `Then, select the language of your ReadAlong. We support over 30 different languages, but if your language is not here, you can try using the Undetermined (und) option. If that doesn't work very well, you can always add your own language. This requires some understanding of your language's writing system. Feel free to reach out to us or visit our <a href="https://blog.mothertongues.org/g2p-background/">blog posts</a> for more information.`,
  attachTo: {
    element: "#language-section",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: "Back",
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: "Next",
      type: "next",
    },
  ],
  id: "data",
};

export const final_step: any = {
  title: "That's it!\n",
  text: `Once you've done this, you can click the "next step" button here to let Studio build your ReadAlong!`,
  attachTo: {
    element: "#next-step",
    on: "bottom",
  },
  buttons: [
    {
      classes: "shepherd-button-primary",
      text: "Back",
      type: "back",
    },
    {
      classes: "shepherd-button-primary",
      text: "Finish",
      type: "cancel",
    },
  ],
  id: "data",
};
