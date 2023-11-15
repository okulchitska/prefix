'----------------------------------------------------------------------------------------------------------------------------------------------------
'	# Reusable Action Inv_LoginAndTriggerFlight
'
' 		~ This Action performs launching of Inventory using .bat file,Then Enter login credential it log-in to Application.

'		~ Usage	 : Direct run or RunAction "Inv_LoginAndTriggerFlight [Inv_LoginAndTriggerFlight]", oneIteration 
' 		~ Input  : Airline code,Environment(pdt,uat etc) and flight date should be passed as environment variable. Below are e.g
'                   environment.Value("e_FlightDate")
'					environment.Value("e_FlightNo")
'					environment.Value("e_AirlineCode")
'		~ Output : e_LoginStatus true or false
'
'	@author		:   Ravi kumar
'	@copyright	:  	2017 Amadeus Services Limited. All rights reserved.
'	@contact	:   ravi.kumar@amadeus.com
'	@deffield	:   Created:1/02/2018  | Last Updated: 
'----------------------------------------------------------------------------------------------------------------------------------------------------

'Load Everything needed for automation
'Common_Init

'environment.Value("e_LoginAirLine")="1A"
Common_FetchLoginProperties "1A"

'Varibale initialisation
s_FlightDate=environment.Value("e_FlightDate")
s_Connection=LCase(environment.Value("TestEnv_Connection"))
s_AirlineCode=environment.Value("login_Airline")
s_UserID=environment.Value("login_UserID")
s_Password=environment.Value("login_Password")
s_DutyCode=environment.Value("login_DutyCode")
s_RemoteOffice=environment.Value("login_RemoteOffice")
s_lstAuthentication=environment.Value("login_lstAuthentication")

'//Adding year at the end of date. E.g if input is 13FEB the append year to make it 13FEB18
s_MonthMMM=UCase(right(s_FlightDate,3))
s_TimeStampDate= Now()
s_year=Year(s_TimeStampDate)
s_month=monthname(month(s_TimeStampDate))
s_monthNow=UCase(Left(s_month,3))
s_YearYY=right(s_year,2)
s_YearNextYear=s_YearYY+1

If s_monthNow="DEC" and s_MonthMMM <> "DEC" Then
	s_FlightDateDDMMYY=s_FlightDate & s_YearNextYear
Else 
   s_FlightDateDDMMYY=s_FlightDate & s_YearYY
End If

' // This checks if Invenory is open if yes then it closed the application

If JavaWindow("wndInventory").exist(1) Then
   ' // This checks if Invenory has auto logged out then it closed the application
'   If JavaWindow("wndInventory").JavaDialog("dlgReEnterPassword").JavaButton("btnExit").Exist(1) Then
'      JavaWindow("wndInventory").JavaDialog("dlgReEnterPassword").JavaButton("btnExit").Click
'   Else
'   JavaWindow("wndInventory").JavaMenu("mnuFile").JavaMenu("mnuExit").Select
'   End If
	Common_KillGUIApp "AlteaPlanLauncher.exe"
End If

' // Launch the Inventory

'systemutil.Run "C:\Program Files (x86)\Altea Inventory TST\Inv_Generic.bat"
Common_AppLaunch "INVENTORY"

'// wait for Inventory login page to come up.
JavaWindow("wndInventory").JavaDialog("dlgSignIn").WaitProperty "text","Sign in",900000

If JavaWindow("wndInventory").JavaDialog("dlgSignIn").Exist(10) Then
   call Common_CaptureScreenshot("Inventory Launch Sucessfull",1)
   
   'Login to application
   	's_AirlineCode=environment.Value("login_Airline")
  	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaList("lstConnection").Select s_Connection
  	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtUserID").SetSecure s_UserID
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtPassword").SetSecure s_Password
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtOrganization").Set "1A"
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaButton("btnAdvanced").Click
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaList("lstAuthentication").Select s_lstAuthentication
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaList("lstDutyCode").Select s_DutyCode
'	If JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtOfficeID").GetROProperty ("enabled")=True Then
'	   JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtOfficeID").Set s_RemoteOffice
'	End If
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtRemoteOffice").highlight
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaEdit("txtRemoteOffice").Set s_RemoteOffice
	JavaWindow("wndInventory").JavaDialog("dlgSignIn").JavaButton("btnSignIn").Click
	
	'Search for the flight and trigger the flight
	if JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Exist(100) then
	   call Common_CaptureScreenshot("Inventory LoginSucessfull",1)
	   wait 5
       	   
       JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Set "ON"
      
       JavaWindow("wndInventory").JavaMenu("mnuFlightDateInformation").Select
       
       If JavaWindow("wndInventory").JavaInternalFrame("wndSearchFlightDateOperational").Exist Then
           	  
	          JavaWindow("wndInventory").JavaInternalFrame("wndSearchFlightDateOperational").JavaEdit("txtAirlineCode").Set environment.Value("e_AirlineCode")
	          JavaWindow("wndInventory").JavaInternalFrame("wndSearchFlightDateOperational").JavaEdit("txtFlightNo").Set environment.Value("e_FlightNo")       
			  JavaWindow("wndInventory").JavaInternalFrame("wndSearchFlightDateOperational").JavaEdit("txtFlightDate").Set s_FlightDateDDMMYY
	          JavaWindow("wndInventory").JavaInternalFrame("wndSearchFlightDateOperational").JavaButton("btnSearch").Click
	          If JavaWindow("wndInventory").JavaInternalFrame("wndFlightDateInformation").Exist(10) Then
	          	  wait 1
		          JavaWindow("wndInventory").JavaInternalFrame("wndFlightDateInformation").JavaCheckBox("chkActions").Set "ON"
		          JavaWindow("wndInventory").JavaInternalFrame("wndFlightDateInformation").JavaMenu("mnuTriggerDCSFlightCreate").Select
		          
			          If JavaWindow("wndInventory").JavaDialog("dlgInformation").Exist Then
			          	 call Common_CaptureScreenshot("Flight triggered Sucessfull",1)
			             JavaWindow("wndInventory").JavaDialog("dlgInformation").JavaButton("btnOK").Click
			             wait 1
'			             JavaWindow("wndInventory").JavaMenu("mnuFile").JavaMenu("mnuExit").Select
			             environment.Value("e_Inv_Login")=True
		             Else
		             '' This is to handle if flight is cancelled
			             If JavaWindow("wndInventory").JavaDialog("dlgInformation").JavaButton("btnOK").exist(1) Then
			             	 JavaWindow("wndInventory").JavaDialog("dlgInformation").JavaButton("btnOK").Click
			             End If
		  		 	    call Common_CaptureScreenshot("wndInformation does not exit",0)
		  		 	    environment.Value("e_Inv_Login")=False
			
			         End If
		      Else
		  		 	call Common_CaptureScreenshot("wndSearchFlightDateOperational does not exit",0)
		  		 	environment.Value("e_Inv_Login")=False
		      End If     
		        
        Else
  		 	call Common_CaptureScreenshot("wndSearchFlightDateOperational does not exit",0)
  		 	environment.Value("e_Inv_Login")=False
        End If
    Else
  		 call Common_CaptureScreenshot("Inventory login failed",0) 
         environment.Value("e_Inv_Login")=False  		 
    End if 
   
Else
   call Common_CaptureScreenshot("Inventory Launch failed",0)
   environment.Value("e_Inv_Login")=False
End If


