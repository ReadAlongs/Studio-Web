Web Deployment Guide

This bundle has everything you need to host your ReadAlong on your own server.

Your audio, (optional) image, and alignment (.readalong) assets are stored in the assets folder.

The plain text used to create your ReadAlong is also stored here along with an example index.html file.

Your index.html file demonstrates the snippet and imports needed to host the ReadAlong on your server.

Please host all assets on your server, include the font and package imports defined in the index.html in your website's imports, and include the corresponding <read-along> snippet everywhere you would like your ReadAlong to be displayed.
    

WordPress Deployment Guide


Setup the plugin (do this once)

Install and activate our plugin 'wp-read-along-web-app-loader' on your WordPress site.

See https://github.com/ReadAlongs/Studio-Web/tree/main/packages/web-component/wordpress-plugin for more information.


Deploy the read-along

Upload the images, sentence-paragr-20241023184608.readalong and sentence-paragr-20241023184608.mp3 to your Media Library of your WordPress site.

Use the text editor to paste the snippet below in your WordPress page:

        ---- WordPress Deployment SNIPPET ----

<!-- wp:html -->
[read_along_web_app_loader version="^1.5.1"]
  <read-along href="/wp-content/uploads/2024/10/sentence-paragr-20241023184608.readalong" audio="/wp-content/uploads/2024/10/sentence-paragr-20241023184608.mp3" theme="light" language="eng" image-assets-folder="/wp-content/uploads/2024/10/">
            <span slot='read-along-header'>Sentence Paragraph Page</span>
            <span slot='read-along-subheader'>by me</span>
        </read-along>
[/read_along_web_app_loader]
<!-- /wp:html -->
        ----- END OF SNIPPET----
