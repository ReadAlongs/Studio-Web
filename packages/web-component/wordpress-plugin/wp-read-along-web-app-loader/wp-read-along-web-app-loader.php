<?php
/**
 * This plugin loads the scripts and styles for a read along component
 * 
 * @link https://github.com/ReadAlongs/
 * @since 1.0.0
 * 
 * @package WP_Read_Along_Web_App_Loader
 * 
 * @wordpress-plugin
 * Plugin Name:       WordPress Read Along Web App Loader
 * Plugin URI:        https://github.com/ReadAlongs/Studio-Web/
 * Description:       This plugin allows you to inject the script and styles needed to activate the <read-along> tag in wordpress site
 * Version:           1.0.0
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
define("WP_Read_Along_Web_App_Loader_VERSION", "1.0.0");

/**
 * This function handles the activation of the code
 * The [wp_read_along_web_app_loader src="" version=""] short code
 * Accepts version: on unpkg
 * Accepts src: custom source
 */

function wp_read_along_web_app_loader_short_code(
    $attrs = [],
    $content = null,
    $tag = ""
) {
    // normalize attribute keys, lowercase
    $attrs = array_change_key_case((array) $attrs, CASE_LOWER);
    $attributes = shortcode_atts(
        [
            "version" => "latest",
            "src" =>
                "https://unpkg.com/@readalongs/web-component@%s/dist/web-component/web-component.esm.js",
        ],
        $attrs,
        $tag
    );
    $output = "";
    wp_enqueue_style(
        "WP_Read_Along_Web_App_Loader_Font",
        "https://fonts.googleapis.com/css?family=Lato%7CMaterial+Icons%7CMaterial+Icons+Outlined",
        [],
        false
    );
    if (!is_null($content)) {
        $output = apply_filters("the_content", $content);
    }
    $src = $attributes["src"];
    //format
    if (!array_key_exists("src", $attrs) || stristr($src, "%s")) {
        $src = sprintf($src, $attributes["version"]);
    }
    return $output .
        "\n\n" .
        sprintf("<script type=\"module\" src='%s'></script>", $src);
}
/**
 * Register read-along formats
 */
function add_read_along_format($mimes = [])
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

function run_wp_read_along_web_app_init()
{
    if (!shortcode_exists("wp_read_along_web_app_loader")) {
        add_shortcode(
            "wp_read_along_web_app_loader",
            "wp_read_along_web_app_loader_short_code"
        );
    }
}
/**
 * Begins execution of the plugin.
 *
 * @since    1.0.0
 */
function run_wp_read_along_web_app()
{
    add_action("init", "run_wp_read_along_web_app_init", 11); //hook to the init
}
run_wp_read_along_web_app(); //run the plugin
add_filter("upload_mimes", "add_read_along_format");
