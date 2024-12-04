=== ReadAlong Web App Loader ===
Contributors: deltork
Tags: read-along, read along, web app loading
Requires at least: 6.5.0
Tested up to: 6.5.2
Stable tag: 1.3.0
Requires PHP: 7.0
License: MIT
License URI: https://github.com/ReadAlongs/Studio-Web/blob/main/LICENSE

This WordPress plugin allows the deployment and activation of a Read-Along generated using https://github.com/ReadAlongs/ on WordPress sites.


== Description ==
This plugin loads the script and styles needed to activate the &lt;read-along&gt; tag in a Word Press site.
This WordPress plugin allows the deployment and activation of a Read-Along generated using https://github.com/ReadAlongs/ on WordPress sites. Just wrap your `<read-along>` in a WordPress shortcode `[read_along_web_app_loader]`. The plugin does not load the script on all pages on your site; it will only add the script to the pages with the shortcode.
The shortcode accepts one optional attribute:
 - The `version` attribute for which version of the read-along generator

== Frequently Asked Questions ==

= How to get the code required for my read along =

Copy the code from the WordPress deployment section of the readme.txt

= How do I generate a read along =

There are two ways to generate a read-along. The online web app (download the web bundle) and the cli visit https://github.com/ReadAlongs/ for more information

== Screenshots ==

1. Configure read-along web app component in your WordPress classic editor
2. Sample read-along book
3. Configure read-along web app component in your WordPress block editor

== Changelog ==
= 1.3.0=
* Embedded the ReadAlong app scripts
= 1.0.0 =
* Initial Release



== Upgrade Notice ==
