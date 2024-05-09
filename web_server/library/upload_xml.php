<?php
    header("Content-Type: application/octet-stream");
    if(isset($_FILES["file"]['tmp_name'])){
        if(move_uploaded_file($_FILES["file"]["tmp_name"], "../photo.xml")){
            echo("200 OK");
        }
    }
