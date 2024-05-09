<?php
    require("config.php");
    if(!isset($_GET["train"]) || !isset($_GET["track"]) || !isset($_GET["speed"])){
        die('{"status":"error"}');
    }
    $train = $_GET["train"];
    $track = $_GET["track"];
    $speed = min(255, max(-255, $_GET["speed"]));
    echo(shell_exec("sudo -u $USER $PATH/Remote command $track $train $speed"));