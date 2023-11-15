'----------------------------------------------------------------------------------------------------------------------------------------------------
'	# Reusable Action Inv_Login
'
' 		~ This Action performs launching of Inventory using .bat file. Enter login credential and sign in.

'		~ Usage	 : RunAction "Inv_Login [Inv_Login]", oneIteration 
' 		~ Input  : Environment(pdt,uat etc),User ID (encrypted),Password (encrypted) should be passed as environment variable. Below are e.g
'					environment.Value("e_ConnectionEnv")
'					environment.Value("e_UserID")
'					environment.Value("e_Password")
'		~ Output : e_LoginStatus true or false
'
'	@author		:   Ravi kumar
'	@copyright	:  	2018 Amadeus Services Limited. All rights reserved.
'	@contact	:   ravi.kumar@amadeus.com
'	@deffield	:   Created:6/04/2018  | Last Updated: 
'----------------------------------------------------------------------------------------------------------------------------------------------------

Common_FetchLoginProperties "1A"

'Varibale initialisation
s_Connection=LCase(environment.Value("TestEnv_Connection"))
s_UserID=environment.Value("login_UserID")'Encrypted User ID
s_Password=environment.Value("login_Password")'Encrypted Password
s_AirlineCode=environment.Value("login_Airline")
s_DutyCode=environment.Value("login_DutyCode")
s_RemoteOffice=environment.Value("login_RemoteOffice")
s_lstAuthentication=environment.Value("login_lstAuthentication")


' // This checks if Invenory is open if yes then it closed the application

'If JavaWindow("wndInventory").exist(1) Then
'   ' // This checks if Invenory has auto logged out then it closed the application
'   If JavaWindow("wndInventory").JavaDialog("dlgReEnterPassword").JavaButton("btnExit").Exist(1) Then
'      JavaWindow("wndInventory").JavaDialog("dlgReEnterPassword").JavaButton("btnExit").Click
'   Else
'   JavaWindow("wndInventory").JavaMenu("mnuFile").JavaMenu("mnuExit").Select
'   End If
'End If

Common_KillGUIApp "AlteaPlanLauncher.exe"
' // Launch the Inventory

'systemutil.Run "C:\Program Files (x86)\Altea Inventory TST\Inv_Generic.bat"
Common_AppLaunch "INVENTORY"

'// wait for Inventory login page to come up.
JavaWindow("wndInventory").JavaDialog("dlgSignIn").WaitProperty "text","Sign in",9000000

If JavaWindow("wndInventory").JavaDialog("dlgSignIn").Exist(10) Then
   call Common_CaptureScreenshot("Inventory Launch Sucessfull",1)
    'Login to application
  	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaList("lstConnection").Select s_Connection
  	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtUserID").SetSecure s_UserID
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtPassword").SetSecure s_Password
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtOrganization").Set s_AirlineCode
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaButton("btnAdvanced").Click
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaList("lstAuthentication").Select s_lstAuthentication
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaList("lstDutyCode").Select s_DutyCode
'	If JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtOfficeID").GetROProperty ("enabled")=True Then
'	   JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtOfficeID").Set s_RemoteOffice
'	End If
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtRemoteOffice").Set s_RemoteOffice 
	
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaButton("btnSignIn").Click
	'Search for the flight and trigger the flight
	if JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Exist(100) then
	   call Common_CaptureScreenshot("Inventory LoginSucessfull",1)
	   
    Else
  		 call Common_CaptureScreenshot("Inventory login failed",0) 
         environment.Value("e_Inv_Login")=False  		 
    End if 
   
Else
   call Common_CaptureScreenshot("Inventory Launch failed",0)
   environment.Value("e_Inv_Login")=False
End If
