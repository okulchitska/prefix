
    call CM_GetDocumentCount("ATB",true)
    call CM_GetDocumentCount("BTP",true)
	JavaWindow("wndCM").JavaMenu("mnuLogoff").JavaMenu("mnuLogoff").Select
	If JavaWindow("wndCM").JavaDialog("dlgQuestion").JavaButton("btnYes").Exist(5) then
		JavaWindow("wndCM").JavaDialog("dlgQuestion").JavaButton("btnYes").click
		'// to handle task pending pop-up
		if JavaWindow("wndCM").JavaDialog("dlgQuestion").JavaButton("btnYes").Exist(2) then
		JavaWindow("wndCM").JavaDialog("dlgQuestion").JavaButton("btnYes").click
		End If
	End if
	environment.Value("e_LastLoginAirLine")=""
	Reporter.ReportEvent micPass, "CM_Exit", "CM logged Off successfully"


