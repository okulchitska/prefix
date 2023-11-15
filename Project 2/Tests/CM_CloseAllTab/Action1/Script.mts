'---------------------------------------------------------------------------------------------------------------------------------------------
'	# Reusable Action CM_CloseAllTabs
'
' 		~ This Action closes all the Open CM tabs Except Message

'		~ Output : Update test case as pass or fail
'
'	@author		:   Ravi kumar
'	@copyright	:  	2017 Amadeus Services Limited. All rights reserved.
'	@contact	:   ravi.kumar@amadeus.com
'	@deffield	:   Created:03/01/2017  | Last Updated: 
'
'---------------------------------------------------------------------------------------------------------------------------------------------------

If JavaWindow("wndCM").Exist(1) Then
    on error resume next
	err.clear
	For i_Iterator = 1 To 4 Step 1
		JavaWindow("wndCM").JavaMenu("mnuNavigation").JavaMenu("mnuCloseFiles").Select
		if error.number = 0 then
			i_Iterator = 4
		End if
	Next
	On error goto 0
	EnableRecoveryScenario
	
	If JavaWindow("wndCM").JavaDialog("dlgCloseFiles").Exist(3) Then
		JavaWindow("wndCM").JavaDialog("dlgCloseFiles").JavaButton("btnSelectAll").Click
		JavaWindow("wndCM").JavaDialog("dlgCloseFiles").JavaCheckBox("chkMessenger").Set "OFF"
		JavaWindow("wndCM").JavaDialog("dlgCloseFiles").JavaButton("btnOK").Click
		call Common_CaptureScreenshot("All Tabs closed",1)
	else
	    call Common_CaptureScreenshot("All Tabs closed failed",0)
	End If @@ hightlight id_;_6644706_;_script infofile_;_ZIP::ssf9.xml_;_
  
Else
   call Common_CaptureScreenshot("CM_CloseAllTabs",0)
    
End If
