''Inventory Logout
'
'
'SetTimeOutToZero
'
'if JavaWindow("wndInventory").Exist(2) then
'	JavaWindow("wndInventory").JavaMenu("mnuFile").highlight
'	JavaWindow("wndInventory").JavaMenu("mnuFile").JavaMenu("mnuExit").Select
'	
'''	If JavaWindow("wndInventory").Exist(5) Then
'''		call Common_CaptureScreenshot("Inventory Logout failed",0)
'''			else
'''		call Common_CaptureScreenshot("Inventory Logout success",1)
'''	End If
''	Flag=True
''	For i = 1 To 10 Step 1
''		If JavaWindow("wndInventory").Exist(1) Then
''			i=i+1
''	    Else
''	       call Common_CaptureScreenshot("Inventory Logout success",1)
''	       Flag=False
''	       Exit for
''	    End If
''	Next
''	If Flag=True Then
''		call Common_CaptureScreenshot("Inventory Logout failed",0)
''	End If
'End if
'
'
'ResetDefaultTimeOut
'
Common_KillGUIApp "AlteaPlanLauncher.exe"
