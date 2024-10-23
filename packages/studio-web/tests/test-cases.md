# Test cases for end-to-end testing of the ReadAlong Studio-Web Studio and Editor

## Story 1: do stuff all over

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
