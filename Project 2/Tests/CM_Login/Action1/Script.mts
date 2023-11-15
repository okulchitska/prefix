' This test was created using HPE ALM


'----------------------------------------------------------------------------------------------------------------------------------------------------
'	# Reusable Action CM_Login
'
' 		~ This Action performs launching of CM JFE using .bat file,Then Enter WID and then using login credential it logs to Application.
'			* It login based on the Airline passed.

'		~ Usage	 : Direct run or RunAction "Action1 [CM_Login]", oneIteration 
' 		~ Input  : Airline,Environment(PDT,UAT etc)
'		~ Output : e_LoginStatus true or false
'
'	@author		:   Ravi kumar
'	@copyright	:  	2017 Amadeus Services Limited. All rights reserved.
'	@contact	:   ravi.kumar@amadeus.com
'	@deffield	:   Created:14/12/2017  | Last Updated: 
'----------------------------------------------------------------------------------------------------------------------------------------------------




	Common_FetchLoginProperties environment.Value("e_LoginAirLine")
	s_Flag=true
	if Common_EnvVarReplace("e_LastLoginAirLine") <> environment.Value("e_LoginAirLine") then' This is to check if the previous login is of the same airline
		
		s_Connection=environment.Value("TestEnv_Connection")
		s_AirlineCode=environment.Value("login_Airline")
		s_Provider=environment.Value("login_Provider")
		s_CityORAirport=environment.Value("login_CityORAirport")
		s_AirportORCityCode=environment.Value("login_AirportORCityCode")
		s_BuildingORTerminalType=environment.Value("login_BuildingORTerminalType")
		s_BuildingORTerminalNo=environment.Value("login_BuildingORTerminalNo")
		s_Category=environment.Value("login_Category")
		s_Index=environment.Value("login_Index")
		i_LocalID=environment.Value("login_LocalID")
		s_UserID=environment.Value("login_UserID")
		s_Password=environment.Value("login_Password")
		s_DutyCode=environment.Value("login_DutyCode")
		s_RemoteOffice=environment.Value("login_RemoteOffice")
		s_lstAuthentication=environment.Value("login_lstAuthentication")
		
	
		If JavaWindow("wndCM").JavaDialog("dlgSignIn").Exist(3) Then
			If Ucase(JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaEdit("txtOrganization").GetROProperty("text")) = environment.Value("e_LoginAirLine") then 
				CM_SignIn
			   	s_Flag=false
			Else
			   CM_AppClose
			End If
			
		End If
	   If s_Flag=true Then
			If JavaWindow("wndCM").exist(1) Then
			 	CM_AppClose
			End If
			
			Common_JFEAutoDownload
			
			JavaWindow("dlgWIDChooser").WaitProperty "text","Workstation ID Chooser",900000
			
			If JavaWindow("dlgWIDChooser").Exist(60) then
				Print "CM JFE Launch OK!"
			Else
				Print "Retrying CM JFE Launch"
				Common_JFEAutoDownload
			End If
			
			If JavaWindow("dlgWIDChooser").Exist(60) then
				Reporter.ReportEvent micPass, "Jfe Launch", " Successful."
				JavaWindow("dlgWIDChooser").JavaEdit("txtAirline").Set s_AirlineCode
				JavaWindow("dlgWIDChooser").JavaList("lstProvider").Select s_Provider
				JavaWindow("dlgWIDChooser").JavaList("lstCityAirport").Select s_CityORAirport
				JavaWindow("dlgWIDChooser").JavaEdit("txtAirport").Set s_AirportORCityCode
				JavaWindow("dlgWIDChooser").JavaList("lstBuildingTerminal").Select s_BuildingORTerminalType
				JavaWindow("dlgWIDChooser").JavaEdit("txtTerminal").Set s_BuildingORTerminalNo
				JavaWindow("dlgWIDChooser").JavaList("lstCategory").Select s_Category
				JavaWindow("dlgWIDChooser").JavaEdit("txtIndex").Set s_Index
				JavaWindow("dlgWIDChooser").JavaEdit("txtLocalID").Set i_LocalID
				JavaWindow("dlgWIDChooser").JavaButton("btnOK").Click
				CM_SignIn
				environment.Value("e_LastLoginAirLine") = environment.Value("e_LoginAirLine")
			Else	
				call Common_CaptureScreenshot("Login Failed",0)
	           	environment.Value("e_LoginStatus")=Fal
			End If
	   End If
	Else
		Common_Report "Attempted Login to " & environment.Value("e_LoginAirLine") & ". Skipping JFE login As the previous login was for the same Airline"		
	End If

Function CM_SignIn
		s_Connection=environment.Value("TestEnv_Connection")
		s_AirlineCode=environment.Value("login_Airline")
		s_Provider=environment.Value("login_Provider")
		s_CityORAirport=environment.Value("login_CityORAirport")
		s_AirportORCityCode=environment.Value("login_AirportORCityCode")
		s_BuildingORTerminalType=environment.Value("login_BuildingORTerminalType")
		s_BuildingORTerminalNo=environment.Value("login_BuildingORTerminalNo")
		s_Category=environment.Value("login_Category")
		s_Index=environment.Value("login_Index")
		i_LocalID=environment.Value("login_LocalID")
		s_UserID=environment.Value("login_UserID")
		s_Password=environment.Value("login_Password")
		s_DutyCode=environment.Value("login_DutyCode")
		s_RemoteOffice=environment.Value("login_RemoteOffice")
		s_lstAuthentication=environment.Value("login_lstAuthentication")
		s_CategoryCode=fetchCategoryValue(s_Category)
		s_WID= s_Provider&"/"&Ucase(left(s_CityORAirport,1))&"/"&s_AirportORCityCode&"/"&Ucase(left(s_BuildingORTerminalType,1))&"/"&s_BuildingORTerminalNo&"/"&"TBD"&"/"&s_Index&"/"&i_LocalID
		
	JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaList("lstConnection").Select s_Connection
	If ucase(s_AirlineCode) = "1A" Then
		JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaEdit("txtUserID").SetSecure s_UserID
	Else
		JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaEdit("txtUserID").Set s_UserID
	End If
	If s_Password<>NULL or s_Password<>"" Then
		JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaEdit("txtPassword").SetSecure s_Password
	End If
	JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaButton("btnAdvanced").Click
	If s_DutyCode<>NULL or s_DutyCode<>"" Then
	   JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaList("lstDutyCode").Select s_DutyCode	
	End If
	If s_RemoteOffice<>NULL or s_RemoteOffice<>"" Then
	   JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaEdit("txtRemoteOffice").Set s_RemoteOffice	
	End If
	If s_lstAuthentication<>NULL or s_lstAuthentication<>"" Then
		SetTimeOutToZero
		if JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaList("lstAuthentication").Exist(1) then
			JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaList("lstAuthentication").select s_lstAuthentication
		End If
		ResetDefaultTimeOut
	End If
	Call Common_CaptureScreenshot("Login Credentails Entered",1)
	JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaButton("btnSignIn").Click
	'This is to handle pop-up which may appear on login
	If (s_AirlineCode="KE") or (s_AirlineCode="SQ") Then
	    If JavaWindow("wndCM").JavaDialog("wndWarning").Exist(10) then
		    JavaWindow("wndCM").JavaDialog("wndWarning").JavaButton("btnOK").Click
        End If
	End If
	If JavaWindow("wndCM").JavaButton("btnSubscribe").Exist Then
	    JavaWindow("wndAmadeusDeviceSimulator").Minimize
		If JavaWindow("wndCM").JavaButton("btnAdvancedOptions").Exist(2) = false Then
			JavaWindow("wndCM").JavaMenu("mnuApplications").JavaMenu("mnuMyPreferences").Select
			Common_CMScreenCheck "Update Preferences"
			Common_SetTableValue "wndCM","tblInnerTable","COL(0)|Advanced Options:","Agent Preference|Closed"
			JavaWindow("wndCM").JavaButton("btnUpdate").Click
	    End If
		call Common_CaptureScreenshot("Login Successful",1)
		environment.Value("e_LoginStatus")=True
	Else
	   Call Common_CaptureScreenshot("Login Failed",0)
	   environment.Value("e_LoginStatus")=False 
	End If
	If not environment.Value("e_LoginStatus") then
		reporter.ReportEvent micFail,"CM_Login","Login Failed"
		ExitTest
	Else
		JavaWindow("wndCM").Activate  'To facilitate CM window to be active than having simulator window open
		wait 2
		JavaWindow("wndCM").Maximize
		wait 2
		reporter.ReportEvent micPass,"CM_Login","Login Successful"
	End if
End  Function	

Function fetchCategoryValue(sValue)
    Dim objCategory
    Set objCategory = CreateObject("Scripting.Dictionary")
    objCategory.Add "Airport Check In","CKI"
    objCategory.Add "Gate","GTE"
    objCategory.Add "Boarding Monitoring Desk","BMD"
    objCategory.Add "Catering","CAT"
    objCategory.Add "Load Control","LCO"
    objCategory.Add "Lounge","LGE"
    objCategory.Add "Ticket Desk","TKT"
    objCategory.Add "Self Service Kiosk","SSK"
    objCategory.Add "Customer service Desk","CSD"
    objCategory.Add "Airport Back Office","BOF"
    objCategory.Add "Transfer Desk","TRA"
    objCategory.Add "Training","TRN"
    objCategory.Add "Regulatory Authorities","REG"
    objCategory.Add "Cargo","CAR"
    objCategory.Add "Ramp","RAM"
    objCategory.Add "Baggage","BAG"
    objCategory.Add "Passenger Services Facilities","PSF"
    objCategory.Add "Engineering","ENG"
    objCategory.Add "Security","SEC"
    objCategory.Add "Airline Administration","ADM"
    objCategory.Add "Test-bed","TBD"
    
    fetchCategoryValue=Ucase(objCategory(sValue))
End Function

Public Function CM_AppClose()
	
If JavaWindow("wndCM").Exist(10) Then
		Common_KillGUIApp "1A-Launcher.exe"
	End If
'	If JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaButton("btnExitSignInPage").exist(2) Then
'		JavaWindow("wndCM").JavaDialog("dlgSignIn").JavaButton("btnExitSignInPage").Click
'		If JavaWindow("wndCM").Exist(10) Then
'			Common_KillGUIApp "1A-Launcher.exe"
'		End If
'	Else
'	   JavaWindow("wndCM").JavaMenu("mnuLogoff").JavaMenu("mnuExit").Select
'       	If JavaWindow("wndCM").Exist(10) Then
'			Common_KillGUIApp "1A-Launcher.exe"
'		End If
'	End If
'	
'	If JavaWindow("wndCM").JavaDialog("dlgQuestion").JavaButton("btnYes").Exist(2) then
'		JavaWindow("wndCM").JavaDialog("dlgQuestion").JavaButton("btnYes").click
'		'// to handle task pending pop-up
'		if JavaWindow("wndCM").JavaDialog("dlgQuestion").JavaButton("btnYes").Exist(2) then
'		JavaWindow("wndCM").JavaDialog("dlgQuestion").JavaButton("btnYes").click
'		End If
'	End if
	environment.Value("e_LastLoginAirLine")=""
	Reporter.ReportEvent micPass, "CM_Exit", "CM App closed successfully"


End Function



