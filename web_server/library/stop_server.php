<?php
    require("config.php");
    shell_exec("sudo -u $USER kill -INT $(sudo -u $USER ps -ux | awk '{}{if($11 == \"$PATH/RailController\"){print $2}}{}')");