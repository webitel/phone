!macro customInstall
  DetailPrint "Register wtel URI Handler"
  DeleteRegKey HKCR "wtel"
  WriteRegStr HKCR "wtel" "" "Webitel Phone"
  WriteRegStr HKCR "wtel" "URL Protocol" ""
  WriteRegStr HKCR "wtel\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "wtel\shell" "" ""
  WriteRegStr HKCR "wtel\shell\open" "" ""
  WriteRegStr HKCR "wtel\shell\Open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" %1'
!macroend

!macro customUnInstall
  DetailPrint "Remove wtel URI Handler"
  DeleteRegKey HKCR "wtel"
!macroend
