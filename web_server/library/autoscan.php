<?php
    require("config.php");
    echo(shell_exec("sudo -u $USER $PATH/Autoscan"));