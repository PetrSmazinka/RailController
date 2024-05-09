#ifdef LANG_CS

    #define TXT_SETUP "INFO: Server byl spuštěn"
    #define TXT_XML_LOADED "INFO: XML soubor byl úspěšně načten"
    #define TXT_USER_E_STOP "INFO: Nouzové zastavení EMERGENCY_STOP vyžádané uživatelem úspěšně provedeno"
    #define TXT_FIRST_CORRECTION "POZNÁMKA: Provedena korekce první úrovně z úseku %d na úsek %d"
    #define TXT_SECOND_CORRECTION "POZNÁMKA: Provedena korekce druhé úrovně z úseku %d na úsek %d"
    #define TXT_CORRECTION_FAILED "CHYBA: Vlak na špatném místě. Dvoustupňová korekce rovněž selhala, aktivuji EMERGENCY_STOP, prosím restartujte server."
    #define TXT_NEW_QUERY "INFO: Nový požadavek byl vložen do fronty (Vlak: %d, cíl: %d)"
    #define TXT_PATH_FOUND "INFO: Volná cesta pro vlak %d obsahuje %d úseků (start: %d, cíl: %d)"
    #define TXT_SWITCHES "INFO: Přestavuji výhybky pro vlak %d"
    #define TXT_TRAIN_MOVE "INFO: Vlak %d jede rychlostí %d"
    #define TXT_TRAIN_MOVE_ERROR "VAROVÁNÍ: Nepodařilo se rozjet vlak %d, zkusím později znovu"
    #define TXT_WRONG_PLACE "CHYBA: Vlak %d na špatné pozici (%d), aktivuji EMERGENCY_STOP, prosím restartujte server."
    #define TXT_TRAIN_DESTINATION "INFO: Vlak %d dorazil do cíle"
    #define TXT_TRAIN_DESTINATION_ERROR "VAROVÁNÍ: Vlak %d dorazil do cíle a přestal komunikovat, prosím zkontrolujte"
    #define TXT_OTHER_ERROR "CHYBA: Vyskytla se nespecifikovaná chyba, aktivuji EMERGENCY_STOP, prosím restartujte server"

#else

    #define TXT_SETUP "INFO: Server has started"
    #define TXT_XML_LOADED "INFO: XML file successfully loaded"
    #define TXT_USER_E_STOP "INFO: EMERGENCY_STOP requested by user successfully performed"
    #define TXT_FIRST_CORRECTION "NOTICE: Performed first level of correction from rail %d to rail %d"
    #define TXT_SECOND_CORRECTION "NOTICE: Performed second level of correction from rail %d to rail %d"
    #define TXT_CORRECTION_FAILED "ERROR: Train at wrong place. Two-level correction also failed, activating EMERGENCY_STOP, please restart server."
    #define TXT_NEW_QUERY "INFO: New query inserted into queue (Train: %d, destination: %d)"
    #define TXT_PATH_FOUND "INFO: Free path for train %d consists of %d tracks (start: %d, end: %d)"
    #define TXT_SWITCHES "INFO: Changing switches for train %d"
    #define TXT_TRAIN_MOVE "INFO: Train %d is now moving with speed %d"
    #define TXT_TRAIN_MOVE_ERROR "WARNING: Failed to start train %d, will try it again later"
    #define TXT_WRONG_PLACE "ERROR: Train %d at wrong place (%d), activating EMERGENCY_STOP, please restart server"    
    #define TXT_TRAIN_DESTINATION "INFO: Train %d reached its destination"
    #define TXT_TRAIN_DESTINATION_ERROR "WARNING: Train %d reached its destination and stopped responding, please check"
    #define TXT_OTHER_ERROR "ERROR: Unspecified error has occured, activating EMERGENCY_STOP, please restart server"

#endif