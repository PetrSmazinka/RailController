<?php
    require("config.php");
    if(!isset($_GET["ip"]) || !preg_match('/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/', $_GET["ip"])){
        die('{"status": "error"}');
    }
    $ip = $_GET["ip"];
    echo(shell_exec("sudo -u $USER $PATH/Remote loco $ip"));