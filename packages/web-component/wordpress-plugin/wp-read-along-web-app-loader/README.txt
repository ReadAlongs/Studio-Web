=== Plugin Name ===
Contributors: 
Donate link: 
Tags: read-along
Requires at least: 4.7
Tested up to: 5.4
Stable tag: 4.3
Requires PHP: 7.0
License: MIT
License URI: https://github.com/ReadAlongs/Studio-Web/blob/main/LICENSE

This WordPress plugin allows the deployment and activation of Read-Along generated using https://github.com/ReadAlongs/ on WordPress sites.
== Description ==

This WordPress plugin allows the deployment and activation of Read-Along generated using https://github.com/ReadAlongs/ on WordPress sites. Just wrap your <read-along> in a WordPress shortcode [wp_read_along_web_app_loader]. The plugin does not load the script on all pages on your site; it will only add the script to the pages with the shortcode.
The shortcode accepts two optional attributes:
 - The `src`: attribute for users with custom scripts defaults to unpkg.com
 - The `version`: attribute for which version on unpkg.com defaults to the latest

== Frequently Asked Questions ==

= How do get the code required for my read along =

Copy the code from the WordPress deployment section of the readme

= How do I generate a read along =

There are two ways to generate a read-along. The online web app and the cli visit https://github.com/ReadAlongs/ for more information

== Screenshots ==

1. Configure read along web app component in your WordPress text editor
2. Sample read along book 

== Changelog ==

= 1.0 =
* version and src attribute added



== Upgrade Notice ==
