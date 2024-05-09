<?php
    header("Content-Type: application/xml");
    if(isset($_FILES["file"]['tmp_name'])){
        echo(file_get_contents($_FILES["file"]['tmp_name']));
    }
