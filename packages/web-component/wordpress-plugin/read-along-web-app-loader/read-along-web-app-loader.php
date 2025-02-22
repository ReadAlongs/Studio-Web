<?php

/**
 * This plugin loads the scripts and styles for a read along component
 *
 * @link https://github.com/ReadAlongs/
 * @since 1.0.0
 *
 * @package Read_Along_Web_App_Loader
 *
 * @wordpress-plugin
 * Plugin Name:       Read-Along Web App Loader
 * Plugin URI:        https://github.com/ReadAlongs/Studio-Web/
 * Description:       This plugin loads the script and styles needed to activate the &lt;read-along&gt; tag in a Word Press site
 * Version:           1.5.0
 * Author:            Delasie Torkornoo
 * License:           MIT
 * License URI:       https://github.com/ReadAlongs/Studio-Web/blob/main/LICENSE

 */

// If this file is called directly, abort.
if (!defined("WPINC")) {
  die();
}
/**
 * Currently plugin version.
 */
define("Read_Along_Web_App_Loader_VERSION", "1.5.0");
define("Read_Along_Web_App_VERSION", "1.5.x");
class ReadAlongWebAppLoader
{
  /**
   * This function handles the activation of the code
   * The [read_along_web_app_loader version=""] short code
   * Accepts version of read-along generated
   */

  public static function short_code($attrs = [], $content = null, $tag = "")
  {
    $output = "";
    // normalize attribute keys, lowercase
    $attrs = array_change_key_case((array) $attrs, CASE_LOWER);
    $attributes = shortcode_atts(
      [
        "version" => Read_Along_Web_App_VERSION,
      ],
      $attrs,
      $tag
    );

    if (!is_null($content)) {
      $output = apply_filters("the_content", $content);
    }

    $src = sprintf(
      "https://unpkg.com/@readalongs/web-component@%s/dist/web-component/web-component.esm.js",
      $attributes["version"]
    );
    //script source code https://github.com/ReadAlongs/Studio-Web/
    wp_enqueue_script_module(
      "read_along_web_component_script",
      $src,
      [],
      Read_Along_Web_App_VERSION
    );
    return $output;
  }
  /**
   * Register read-along formats
   */
  public static function supported_format($mimes = [])
  {
    //add key for read along format
    $mimes["readalong"] = "text/xml";
    //add other supported audio formats
    $mimes["m4a"] = "audio/mp4";
    $mimes["wav"] = "audio/wav";

    return $mimes;
  }
  /**
   * add the shortcode
   *
   */

  public static function init()
  {
    if (!shortcode_exists("read_along_web_app_loader")) {
      add_shortcode("read_along_web_app_loader", [
        get_called_class(),
        "short_code",
      ]);
    }
  }
  /**
   * Begins execution of the plugin.
   *
   * @since    1.0.0
   */
  public static function run()
  {
    add_action("init", [get_called_class(), "init"], 11); //hook to the init
  }
}
add_filter("upload_mimes", ["ReadAlongWebAppLoader", "supported_format"]); //add supported formats
ReadAlongWebAppLoader::run(); //run the plugin
