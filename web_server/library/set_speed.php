<?php
    require("config.php");
    if(!isset($_GET["ip"]) || !isset($_GET["speed"]) || !preg_match('/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/', $_GET["ip"])){
        die('{"status": "error"}');
    }
    $ip = $_GET["ip"];
    $speed = min(255, max(-255, $_GET["speed"]));
    echo(shell_exec("sudo -u $USER $PATH/Remote shunting $ip $speed"));