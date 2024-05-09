# RailController

RailController je softwarové řešení, které umožňuje automatizaci řízení modelového kolejiště. Skládá se ze tří částí: systémového jádra, HTTP serveru a programu vláčku.

## Systémové jádro + HTTP server

Ve výchozím nastavení běží obě součásti na jednom zařízení. 

### Instalace systémového jádra

1. K zařízení je nutno do CSI-2 portu připojit kameru a nainstalovat knihovnu libcamera
1. Správnou instalaci lze ověřit zadáním příkazu `libcamera-still`
1. Dále je třeba nainstalovat knihovny Boost, OpenCV, pugixml a nlohmann/json.
1. K překladu je nutné mít nainstalovaný nástroj CMake
1. V souboru `common.hpp` je možné zvolit jazyk logovacích výstupů pomocí přidání/odebrání direktivy **#define LANG_CS** (dle toho dojde k překladu s českými/anglickými výstupy).
1. Instalace probíhá v adresáři `system_core` zadáním: 
```
mkdir build
cd build
cmake ..
make
```
5. Cestu k `build` složce s přeloženými binárními soubory je nutné vložit do konfiguračního souboru HTTP serveru `library/config.php` (ve výchozím nastavení obsahuje cestu `/home/pi/RailController/build`).

#### Binární soubory systémového jádra

- RailController – stále běžící server řídící kolejiště
   
   `./RailController [--take-picture [soubor.jpg]]`

- ConnectionTester – program pro testování komunikace s mašinkami

    `./ConnectionTester <IP-vlaku> <ID-vlaku> <intenzita-led> <rychlost> <maska> `

- Autoscan – program pro nalezení vláčků v lokální síti

    `./Autoscan` (seznam v podobě souboru `train_list.txt` uložen ve složce, ze které byl program spuštěn)

- Remote – klientský program pro přístup k datům ve sdílené paměti se serverem

    `./Remote [příkaz] [...[...]]`

    Příkazy:

    | příkaz  | význam | formát |
    |---------|--------|--------|
    | command | Vložení nového požadavku do fronty | `./Remote command <id-ciloveho-bloku> <id-vlaku> <rychlost>` |
    | state   | Získání informací o aktuálním stavu kolejiště ve formátu .json | `./Remote state` |
    | light   | Umožňuje nastavit intenzitu Flash LED umístěné v přední části vlaku | `./Remote light <ip-adresa> <intenzita>` |
    | shunting | Umožňuje nastavit rychlost jízdy lokomotivy | `./Remote shunting <ip-adresa> <rychlost>` |
    | loco | Slouží pro získání aktuálního stavu vláčku | `./Remote loco <ip-adresa>` |
    | stop | Vyvolání události nouzového zastavení (EMERGENCY_STOP) | `./Remote stop` |

### Instalace HTTP serveru

1. Nejprve je nutné nainstalovat libovolný webový server, například Apache.
1. Instalace probíhá nahráním zdrojových souborů do kořenového adresáře webového serveru (složka `web_server`).
1. Je-li cesta ke kořenovému adresáři, respektive ke složce, kam byl nahrán obsah adresáře `web_server` jiná než implicitní `/var/www/html`, je potřeba upravit konfigurační soubor `common.hpp` a vložit tuto cestu do direktivy **#define HTTP_ROOT**.

### Ověření instalace

K ověření správného instalace zadejte do vyhledávacího pole ve webovém prohlížeči *http://\<ip-adresa>*, kde *\<ip-adresa>* je adresou serveru a lze ji získat například pomocí příkazu `ifconfig`. Je-li vše správně nainstalováno, mělo by v přehledu dojít k načtení vzorového kolejiště. Při stisknutí tlačítka pořízení snímku by mělo dojít ke změně pozadí z výchozího na aktuálním snímek pořízený kamerou

## Vytvoření lokální sítě

Je doporučeno provozovat kolejiště v podsíti, která je oddělená od zbytku sítě, nicméně není to nutnou podmínkou. Ve výchozím nastavení vláčky očekávají Wi-Fi síť s SSID názvem **RAILNET** a přístupovým heslem **railnetwork**. Při připojení k Wi-Fi síti s jinými přístupovými údaji je nutné tyto údaje vložit do souboru `wifi_credentials.h`, viz dále.

## Program vláčku

1. K nahrání programu do vláčku je vyžadován USB-UART převodník a vhodný software (například vývojové prostředí PlatformIO).
1. Ve vývojovém prostředí je nutné založit nový projekt pro modul *AI Thinker ESP32-CAM*.
1. Instalace probíhá nahráním obsahu adresáře `loco` do adresáře `src` nově vytvořeného projektu.
1. Pokud bude zařízení provozováno na jiné Wi-Fi síti než výchozí RAILNET:railnetwork, je nutné změnit přístupové údaje v souboru `wifi_credentials.h`.
1. Pro nahrání programu do mudulu je nutné připojit ESP32-CAM k USB-UART převodníku následujícím způsobem. **Během nahrávání programu je rovněž nezbytné propojit pin GPIO0 s pinem GND**

| USB-UART převodník | AI Thinker ESP32-CAM |
|--------------------|----------------------|
|         5V         |          5V          |
|        GND         |         GND          |
|         RX         |        U0TXD         |
|         5V         |        U0RXD         |

1. Při stisknutí tlačítka dojde nejprve ke zkompilování programu a následně započne jeho nahrávání. Modul je nutno během nahrávání resetovat tak, aby k uvolnění tlačítka RESET došlo v okamžiku, kdy je program již zkompilován a začíná fáze nahrávání.

### Ověření instalace.

Po nahrání programu otevřete při stále připojeném modulu přes USB-UART převodník sériový monitor s rychlostí přenosu 115200bd, odpojte propojovací vodič mezi GPIO0 a GND a stiskněte tlačítko RESET. Je-li program nahrán správně mělo by dojít k vypsání jeho verze, následně k připojení k Wi-Fi síti a vypsání přidělené IP adresy.

## Návod k použití

Popis všech možností, které webové rozhraní nabízí, je dostupný na obou kartách (Přehled a Editor) po kliknutí na tlačítko nápovědy.