<html>
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <link rel="stylesheet" href="../assets/css/main.css">
        <script src="../assets/js/swal.js"></script>
    </head>
    <body>
        <div id="canvas">
            <img src="../assets/img/background.png" draggable="false">
        </div>
        <div id="menubar">
            <div class="grab"></div>
            <div class="link link-overview">Přehled</div>
            <div class="link link-editor active">Editor</div>
            <div class="icon icon-normal active"><i class="fa-solid fa-arrow-pointer"></i><span class="tooltip">Režim výběru (N)</span></div>
            <div class="icon icon-insert disabled"><i class="fa-solid fa-pencil"></i><span class="tooltip">Režim kreslení (I)</span></div>
            <div class="icon icon-move disabled"><i class="fa-solid fa-up-down-left-right"></i><span class="tooltip">Režim posunu (M)</span></div>
            <div class="icon icon-more"><i class="fa-solid fa-paragraph"></i><span class="tooltip">Zobrazit podrobnosti (V)</span></div>
            <div class="icon icon-connect disabled"><i class="fa-solid fa-timeline"></i><span class="tooltip">Vytvořit spojení (C)</span></div>    
            <div class="icon icon-direction disabled"><i class="fa-solid fa-arrow-right-arrow-left"></i><span class="tooltip">Změnit směr (X)</span></div>    
            <div class="icon icon-points disabled"><i class="fa-solid fa-spinner"></i><span class="tooltip">Vybrat body (Ctrl+P)</span></div>
            <div class="icon icon-connections disabled"><i class="fa-solid fa-slash"></i><span class="tooltip">Vybrat spojení (Ctrl+C)</span></div>
            <div class="icon icon-unselect disabled"><i class="fa-solid fa-ban"></i><span class="tooltip">Zrušit označení (R)</span></div>
            <div class="icon icon-delete disabled"><i class="fa-solid fa-trash-can"></i><span class="tooltip">Odstarnit označené (D)</span></div>
            <div class="icon icon-edit disabled"><i class="fa-solid fa-pen-to-square"></i><span class="tooltip">Upravit prvek (E)</span></div>
            <div class="icon icon-settings disabled"><i class="fa-solid fa-gear"></i><span class="tooltip">Nastavení plánku (S)</span></div>
            <div class="icon icon-open"><i class="fa-solid fa-image"></i><span class="tooltip">Otevřít obrázek (Ctrl+Shift+O)</span></div>
            <div class="icon icon-import disabled"><i class="fa-solid fa-file-import"></i><span class="tooltip">Importovat (Ctrl+O)</span></div>
            <div class="icon icon-history-back"><i class="fa-solid fa-arrow-rotate-left"></i><span class="tooltip">Zpět (Ctrl+Z)</span></div>
            <div class="icon icon-history-forward"><i class="fa-solid fa-arrow-rotate-right"></i><span class="tooltip">Znovu (Ctrl+Y)</span></div>
            <div class="icon icon-download"><i class="fa-solid fa-download"></i><span class="tooltip">Uložit (Ctrl+S)</span></div>
            <div class="icon icon-help"><i class="fa-solid fa-circle-info"></i><span class="tooltip">Nápověda (H)</span></div>
        </div>
        <form action="../library/open_photo.php" method="post" enctype="multipart/form-data" id="form_open">
            <input type="file" name="file" id="file_to_open" accept="image/*">
        </form>
        <form action="../library/import_xml.php" method="post" enctype="multipart/form-data" id="form_import">
            <input type="file" name="file" id="file_to_import" accept=".xml">
        </form>
    </body>
    <script src="../assets/js/state.js"></script>
    <script src="../assets/js/editor.js"></script>
    <script src="../assets/js/xml.js"></script>
    <script src="../assets/js/xml_import.js"></script>
    <script src="../assets/js/global.js"></script>
</html>
