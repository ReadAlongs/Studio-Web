# Test cases for end-to-end testing of the ReadAlong Studio-Web Studio and Editor

Global setting: make sure analytics is disable, stubbed out, or sent to a fake
server, so we don't generate bogus traffic.

## Story 1: main walk through the Studio

### Fill in Step 1

- Launch Studio.
  - Expect it is loaded.
- Enter this text in the text box.

      This is a test.
      Sentence.

      Paragraph.


      Page.

- Load this audio: `test-sentence-paragraph-page-56k.mp3`.
- Click on "Go to the next step!".
  - Expect alignment to succeed, and step 2 to get displayed with the preview.

### Edit the read along in Step 2

- Click on Title and type "Sentence Paragraph Page".
- Click on Subtitle and type "by me".
- Click in turn on the first and second "+" buttons and add translations "Ceci est un test."
  and "Phrase.", respectively.
- Add translation "Paragraphe." to the 3rd sentence.
- Click "-" to delete the translation of the 2nd sentence, "Sentence."
- Click on the translation toggle.
  - Expect all translations to be hidden.
- Click on the translation toggle again.
  - Expect translations for the 1st and 3rd sentences to be visible.
- Click to add an image on page 1: add `page1.png`
  - Expect the image is visible and the image delete button appears
- Click on Delete to remove the image
  - Expect the option to choose a file is back
- Scroll to page two and add `page2.png`.

### Download formats

- Click on the download button
  - Expect a file download to happen
- Let download1 = name of that downloaded file.
  - Expect download1 matches RE `sentence-paragr-[0-9]*.html`
  - TODO validate the contents, somehow
- Select Web Bundle output format
- Click on the download button
  - Expect a file download to happen
- Let download2 = name of that downloaded zip file.

  - Expect download2 matches RE `sentence-paragr-[0-9]*.zip`
  - Expect download2 contents to look like this:

        $ unzip -l sentence-paragr-20241023184608.zip
        Archive:  sentence-paragr-20241023184608.zip
        Length      Date    Time    Name
        ---------  ---------- -----   ----
                0  2024-10-23 18:46   www/
                0  2024-10-23 18:46   Offline-HTML/
                0  2024-10-23 18:46   www/assets/
           865623  2024-10-23 18:46   Offline-HTML/sentence-paragr-20241023184608.html
            26277  2024-10-23 18:46   www/assets/sentence-paragr-20241023184608.wav
             2023  2024-10-23 18:46   www/assets/image-sentence-paragr-20241023184608-1.png
               45  2024-10-23 18:46   www/sentence-paragr-20241023184608.txt
             1749  2024-10-23 18:46   www/assets/sentence-paragr-20241023184608.readalong
             1378  2024-10-23 18:46   www/index.html
             1750  2024-10-23 18:46   www/readme.txt
        ---------                     -------
           898845                     10 files

    We can't check this exactly, but maybe all the filenames, and some contents:

    - `Offline-HTML/sentence-paragr-<date>.html` is identical to download1.
    - `www/assets/image-sentence-paragr-<date>-1.png` is identical to `page1.png`.
    - `www/assets/sentence-paragr-<date>.wav` is identical to `test-sentence-paragraph-page-56k.mp3`.
    - `www/index.html` is identical to `ref/www/index.html` except for the
      dates, and we'll want soft updating the version number so we don't have to
      change the ref files for each version bump
    - `www/readme.txt` is identical to `ref/www/readme.txt` modulo date and version number.
    - `www/sentence-paragr-<date>.txt` is identical to `ref/www/sentence-paragr-date.txt`.
    - `www/assets/sentence-paragr-<date>.readalong` is identical to
      `ref/www/assets/sentence-paragr-date.readalong` modulo date (for the
      .png file) and time= and dur= values for each word. And maybe get the
      read-along version number from config and studio-cli version number too,
      so the test doesn't fail whenever those get bumped.

- For each of the other four download format:
  - select it
  - click download
  - check the download contents against the matching file in `ref`.
    - Note: those files are all called `readalong.<ext>`, should probably also be `<title>-<date>.<ext>` (#366)

## Story 2: main walk through the Editor

### Load a readalong to edit

- Launch the Editor
- load download1 from story 1
  - Expect the readalong shown
  - Expect no image on page 1, an image on page 2
  - Expect translations for the 1st and 3rd sentence
  - Expect no translation for the second sentence

### edit images

- add image `page1.png` to page 1
  - expect to see it
- remove the image on page 2
  - expect the add image button to be back on page 2

### edit translations

- edit the translation of the first sentence to say "Un vrai test."
- click + to add translation "Phrase." to the second sentence
- click - to delete the translation of the third sentence
  - Expect to see translations for the 1st and 2nd sentence but not the third
- click on translation toggle
  - Expect translations to be hidden
- click on translation toggle
  - Expect to see translations for the 1st and 2nd sentence but not the third

### Change an alignment

- click on "This" in the web-c preview
  - Expect the audio playback cue to be between 0.7 s and 1.0 s in the web-c preview
- Drag the start of "This" to 0.5 s in the Audio Toolbar
- click on "This" in the web-c preview
  - Expect the audio playback cue to be at 0.5 s in the web-c preview

### Change a word

- Before:
  - Expect the second sentence's word in the web-c to read "Sentence"
- click on "Sentence" in the Audio Toolbar
- add an "s" at the end of the word so it spells "Sentences"
  - Expect the second sentence's word in the web-c to read "Sentences" with an "s" added

### Download the results

- Select Web Bundle format
- Click download

  - Expect the .readalong file in the Zip file to match my hand-created `ref/sentence-paragr-edited.readalong` modulo dates.
  - Expect the timing for "This" to be close to `time="0.50" dur="0.57"` (rather than the original `time="0.84" dur="0.23"`)
  - Expect `<w id="t0b0d0p0s1w0"` to be spelled "Sentences" with an "s"
  - Expect `<graphic url="image-sentence-paragr-20241023184608-0.png"/>` on `<div type="page" id="t0b0d0">`
  - Expect no graphic element on `<div type="page" id="t0b0d1">`
  - Expect translations on the first and second sentences
  - Expect no translations on the 3rd and 4th sentences.

- Select the Offline HTML format
- click download

  - Expect a .html file

- Select each of the remaining four formats and download them
  - Expect each to match the corresponding ref file in `ref/edited`.
  - Specifically, in each format, check that
    - "This" starts at 0.5s
    - "Sentences" has been updated to take the plural "s".

## Story 3: run the Tour

### Take the tour from the top right through to the end

- Launch the Studio
- click on "Take the Tour"
  - expect it to start
- click next until "That's it!" is there
- click "Next (overwrites your data)"
  - Expect Step 2 to load and the tour to continue
- click next until "Go to the Editor" is there
- click "Editor" (or "To the Editor" once #349 is merged)
  - Expect the Editor to open and the tour to continue
- click "Next" until the last step, with "Close"
- click "Close"
  - Expect to be in the Editor with the dummy "Hello world!" RA loaded.

### Take the tour from the Editor

- We are still in the Editor at this point.
- Click "Take the Tour".
  - Expect the Editor tour to start.
- Click through the tour.

## Story 4: Analytics

Question: can we stub analytics? I'd like to detect that analytics work without
causing events to be send to Plausible. Maybe we can give it a bogus hostname
and track network traffic? We really don't want these tests to trigger traffic
on Plausible!

### Turn analytics on and off

- Launch Studio
- click on Privacy (will depend on screen size with #349)
  - Expect the Privacy Policy to be displayed
- click on "Opt out of Analytics" if shown (i.e., unless "Opt in to Analytics" is shown)
- click on "I agree"
- Click Take the Tour
  - Expect no event sent to analytics
- type Escape to exit the tour
- Reload the page

  - Expect no event sent to analytics

- Opt in to analytics
- Click Take the Tour
  - Expect a Tour event sent to analytics
- Reload the page

  - Expect a Studio event sent to analytics

- Load text and audio as in Story 1
- click "Go to the next step!"
  - Expect step 2 to show
  - Expect a CreateReadalong event sent to analytics
- click on the Download icon

  - Expect a Download event sent to analytics

- click on "Step 1"
  - Expect step 1 to be shown again
- opt out of analytics
- click on "Go to the next step!"
  - Expect no event sent to analytics
- click on the Download icon
  - Expect no event sent to analytics

## Story 5: click around the Studio a lot

- Load the Studio

### Text entry

- Click on "? Format" in Text entry
  - Expect the "Here is how to format your plain text input text." modal to show
- click on Close
- click on "Go to the next step"
  - Expect three error toasts, including "No text"
- Enter "Random Text" in the text box
- Click on "Save a copy"
  - Expect a `ras-text-<date>.txt` file to be downloaded containing "Random Text"
- Click on File
  - Expect the Choose file option to appear
- click on Choose file and select `ref/www/sentence-paragr-date.txt`
  - Can't expect anything here: the contents never get shown in step 1 we should
    probably fix that, somehow.

### Audio

- Expect to see only the "Record" button
- Click on File
  - Expect the Choose File option
- choose `test-sentence-paragraph-page-56k.mp3`
  - Expect the "Play", "Save a copy" and "Delete" buttons to be shown
- Click on Record
  - Expect the "Delete and re-record", "Play", "Save a copy" and "Delete" buttons to be shown
- Click on Delete
  - Expect to see only the "Record" button"
- click on Go to the next step!
  - Expect two error toasts, including "No audio"
- click on File and reload the same audio file.

### Language settings

- Expect Default is selected
- Expect Select Language drop down to be shown but inactive
- click Select a specific language
  - Expect Select Language drop down to be active
- click "Go the the next step!"
  - Expect the "No language selected" error toast
- Select English

### Go to step 2

- click on Go to the next step!

  - Expect the "Great!" success toast
  - Expect step 2 to load
  - Expect Title and Subtitle to be "Title" and "Subtitle"

- Edit Title and Subtitle to "foo" and "bar"

- click on Step 1 (top left)

  - Expect step 1 to display again with the same text file, audio file and English still selected

- click on Step 2 (top right)

  - Expect step 2 to display, but no toast
  - Expect Title and Subtitle to still be "foo" and "bar".

## Story 6: click around the Editor

- Load the Editor

- Load download1

- In the Audio Toolbar, click on Zoom + twice

  - Expect a zoomed in view showing a shorter duration than the whole

- click on the Zoom - five times (three times is enough on a large screen)
  - Expect the zoomed out view with the whole text and no scrool bar anymore

## Notes and Questions

I assume the web-component testing already verifies play/pause/back 5 sec,
etc, so I'm not covering them here.

Q: Does the web-c testing already test the gear menu for setting My Preferences?
That also doesn't really belong here, but needs to happen somewhere.
