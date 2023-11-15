'----------------------------------------------------------------------------------------------------------------------------------------------------
'	# Reusable Action Admin_Login
'
' 		~ This Action performs launching of Admin application and using 1A login credential it logs to Application.
'			* It login based on the 1A credentials provided in the Login Sheet.

'		~ Usage	 : Direct run or RunAction "Admin_Login [Admin_Login]", oneIteration 
' 		~ Input  : Airline,Environment(PDT,UAT etc) e.g environment.Value("TestEnv_Connection")="pdt"
'		~ Output : environment value "e_Admin_Login" true or false
'
'	@author		:   Ravi kumar
'	@copyright	:  	2018 Amadeus Services Limited. All rights reserved.
'	@contact	:   ravi.kumar@amadeus.com
'	@deffield	:   Created:24/08/2018  | Last Updated: 
'----------------------------------------------------------------------------------------------------------------------------------------------------

Common_FetchLoginProperties "1A"

'Varibale initialisation
s_Connection=LCase(environment.Value("TestEnv_Connection"))
s_UserID=environment.Value("login_UserID")'Encrypted User ID
s_Password=environment.Value("login_Password")'Encrypted Password
s_AirlineCode=environment.Value("login_Airline")
s_DutyCode=environment.Value("login_DutyCode")
s_RemoteOffice=environment.Value("login_RemoteOffice")
s_OfficeID=environment.Value("login_RemoteOffice2")

' // This checks if Invenory is open if yes then it closed the application

If JavaWindow("wndAdmin").exist(1) Then
   'If the Admin is open then it will kill the application.
   Common_KillGUIApp "1A-Launcher.exe"
End If

' // Launch the Admin

Common_AppLaunch "ADMIN"

JavaWindow("wndAdmin").JavaDialog("dlgSignIn").WaitProperty "text","Sign in",9000000

If JavaWindow("wndAdmin").JavaDialog("dlgSignIn").Exist(10) Then
   call Common_CaptureScreenshot("Admin application Launch Successfull",1)
    'Login to application
  	JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaList("lstConnection").Select s_Connection
  	JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaEdit("txtUserID").SetSecure s_UserID
	JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaEdit("txtPassword").SetSecure s_Password
	JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaEdit("txtOrganization").Set s_AirlineCode
	JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaButton("btnAdvanced").Click
	JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaList("lstDutyCode").Select s_DutyCode
	JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaEdit("txtRemoteOffice").Set s_OfficeID
	 JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaEdit("txtOfficeID").Set s_RemoteOffice
	JavaWindow("wndAdmin").JavaDialog("dlgSignIn").JavaButton("btnSignIn").Click
	

	if JavaWindow("wndAdmin").JavaMenu("mnuFile").Exist(120) then
	   call Common_CaptureScreenshot("Admin application Login Sucessfull",1)
	   environment.Value("e_Admin_Login")=true 
    Else
  		 call Common_CaptureScreenshot("Admin application Login failed",0) 
         environment.Value("e_Admin_Login")=False  		 
    End if 
   
Else
   call Common_CaptureScreenshot("Admin application Launch failed",0)
   environment.Value("e_Admin_Login")=False
End If


