<html>
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <link rel="stylesheet" href="assets/css/main.css">
        <script src="assets/js/swal.js"></script>
    </head>
    <body class="disconnected">
        <div id="canvas" class="overview">
            <img src="photo.jpg?uid=<?php echo(uniqid()); ?>" draggable="false">
        </div>
        <div id="menubar">
            <div class="grab"></div>
            <div class="link link-overview active">Přehled</div>
            <div class="link link-editor">Editor</div>
            <div class="icon icon-ride disabled"><i class="fa-solid fa-route"></i><span class="tooltip">Zadat trasu (R)</span></div>
            <div class="icon icon-stream"><i class="fa-solid fa-video"></i><span class="tooltip">Otevřít stream (S)</span></div>
            <div class="icon icon-light"><i class="fa-solid fa-lightbulb"></i><span class="tooltip">Rozsvítit světlo (L)</span></div>
            <div class="icon icon-upload-photo"><i class="fa-solid fa-image"></i><span class="tooltip">Vyfotit kolejiště (Ctrl+C)</span></div>
            <div class="icon icon-upload-xml"><i class="fa-solid fa-file-import"></i><span class="tooltip">Nahrát XML (Ctrl+O)</span></div>
            <div class="icon icon-help"><i class="fa-solid fa-circle-info"></i><span class="tooltip">Nápověda (H)</span></div>
            <div class="icon icon-shunting disabled"><i class="fa-solid fa-gauge-high"></i><span class="tooltip">Manuální pojezd (Ctrl+S)</span></div>
            <div class="icon icon-turn-on-off"><i class="fa-solid fa-power-off"></i><span class="tooltip">Zapnout/vypnout server<br>(Ctrl+Alt+Shift+Enter)</span></div>
            <div class="icon icon-emergency disabled"><i class="fa-solid fa-triangle-exclamation"></i><span class="tooltip">Záchranná brzda<br>(Ctrl+Enter)</span></div>
        </div>
        <div id="statusbar">
            <div class="grab"></div>
        </div>
        <div id="consolebar" class="hide-notices">
            <div class="cross"></div>
            <div class="filterbar">
                <div class="errors"><i class="fa-solid fa-circle-xmark"></i><span class="tooltip tooltip-right">Zobrazit/skrýt chyby</span></div>
                <div class="warnings"><i class="fa-solid fa-circle-exclamation"></i><span class="tooltip tooltip-right">Zobrazit/skrýt varování</span></div>
                <div class="infos"><i class="fa-solid fa-circle-info"></i><span class="tooltip tooltip-right">Zobrazit/skrýt výpis</span></div>
                <div class="notices"><i class="fa-regular fa-file-lines"></i><span class="tooltip tooltip-right">Zobrazit/skrýt poznámky</span></div>
                <div class="delete"><i class="fa-solid fa-trash-can"></i><span class="tooltip tooltip-right">Vyčistit konzoli</span></div>
            </div>
            <div class="pause"><span class="tooltip tooltip-right">Pozastavit výpis</span></div>
            <div class="log-content"></div>
        </div>
        <form action="library/upload_photo.php" method="post" enctype="multipart/form-data" id="form_upload_photo">
            <input type="file" name="file" id="file_to_upload_photo" accept=".jpg">
        </form>
        <form action="library/upload_xml.php" method="post" enctype="multipart/form-data" id="form_upload_xml">
            <input type="file" name="file" id="file_to_upload_xml" accept=".xml">
        </form>
        <div class="state-info">Server není spuštěn</div>
    </body>
    <script src="assets/js/index.js"></script>
    <script src="assets/js/global.js"></script>
    <script>importLocalFile("photo.xml?uid=<?php echo(uniqid()); ?>");</script>
</html>
