<?php
    require("config.php");
    $output = shell_exec("sudo -u $USER $PATH/RailController --take-picture | echo $?");
    if($output == "0\n"){
        die(json_encode(["status" => "ok"]));
    }
    die(json_encode(["status" => "error", "description" => $output]));