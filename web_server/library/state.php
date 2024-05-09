<?php
    require("config.php");
    header("Content-Type: application/json");
    echo shell_exec("sudo -u $USER $PATH/Remote state");