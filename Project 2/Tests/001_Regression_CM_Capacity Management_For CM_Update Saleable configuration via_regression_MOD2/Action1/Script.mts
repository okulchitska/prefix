'#################################################################### 
'# Name:     001_Regression_CM_Capacity Management_For CM_Update Saleable configuration via INV.                  
'#                             
'#  Description: Get seating capacity>> and <<Handle Seating Capacity>> Create new flight in CM and ensure capacity is correct.  Change the saleable config in INV.  Check flight history.            
'#                             
'# Written by:  Rupa
'# Date:        6 June 2018                            
'#                             
'#################################################################### 


'-------------------------------------------------------------------------------------------------------------------------------------------
'This is Auto Generated GATI script from ALM  

'Initialization
Common_Init
'-------------------------------------------------------------------------------------------------------------------------------------------

Common_CallPON
'Dim s_valueOfConfig,s_CMConfigValue,s_InvConfigValue,s_valueOfConfig2,s_CMConfigValue2
's_CMConfigValue=""
's_CMConfigValue2=""
'Your Script Starts from Here ->

'<Begin Step: #STEP1 ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP1", "BEGIN"
'Step 1:
'Login to CM,Go to Flight Application,Enter Flt Details 7X40 AKL-SYD - Press Display
'Expected Result: Messenger Screen displayed,Enter Flt Screen Displayed,Warning: 1400 'No flight found. Try "Search Flight"

environment.Value("e_FlightDate")=environment.Value("PON_FlightDate1")
environment.Value("e_FlightNo")=cint(environment.Value("PON_FLIGHT1"))
environment.Value("e_AirlineCode")=environment.Value("PON_CARRIER1")
environment.Value("e_ConfigCode")=environment.Value("PON_ConfigA1")
environment.Value("e_ConnectionEnv")=Environment("TestEnv_Connection")
environment.Value("e_LoginAirLine")=environment.Value("PON_CARRIER1")
RunAction "CM_Login [CM_Login]", oneIteration
Environment("e_FlightNumber")=environment.Value("e_FlightNo")
'Environment("e_From")=environment.Value("PON_ARR1")
Environment("e_From")=environment.Value("PON_DEP1")
JavaWindow("wndCM").JavaMenu("mnuApplications").highlight
JavaWindow("wndCM").JavaMenu("mnuApplications").JavaMenu("mnuFlight").Select

Common_CMScreenCheck("Enter Flight")

JavaWindow("wndCM").JavaEdit("txtAirlineCode").Set Environment("e_LoginAirLine")
JavaWindow("wndCM").JavaEdit("txtDate").Set Environment("e_FlightDate")
JavaWindow("wndCM").JavaEdit("txtFlightNumber").Set Environment("e_FlightNumber")
JavaWindow("wndCM").JavaEdit("txtAirportFrom").Set Environment("e_From")
call Common_CaptureScreenshot("Flight data entered",2)
JavaWindow("wndCM").JavaButton("btnDisplay").Click


if JavaWindow("wndCM").JavaDialog("wndWarning").Exist(5) Then 
	Common_Report "Messenger Screen Displayed||Passed"
	s_Mesg= Common_StripeHTML(JavaWindow("wndCM").JavaDialog("wndWarning").JavaStaticText("stsMessageOne").GetROProperty("attached text"))
    Common_SimpleCompare "No flight found. Try "&chr(34)&"Search Flight"&chr(34),"=",s_Mesg &"~The warning messege is validated~"
End If 
Reporter.ReportEvent 2, "#L_STEP1", "END"
'<End Step: #STEP1 ------------------------------------>

'<Begin Step: #STEP2 ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP2", "BEGIN"
'Desc:Login to the Altea Inventory 
'Expected Result: Inventory opens


RunAction "Inv_Login [Inv_Login]", oneIteration
Reporter.ReportEvent 2, "#L_STEP2", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP3", "BEGIN"
'Step 3:
'Desc:Menu 1, list of periods, perform a search for 7X40 AKL-SYD flight and ensure it has a single leg, multiple cabins and ensure that the ACV has multiple saleable configs with the same cabins.
'Expected Result:
'list of 7X40 AKL-SYD (need to verify if this has mutiple saleable configs, multiple cabins and single leg) flights appears, select a flight date that has not yet been created in CM.
'

''Validate Config code has multiple saleable config code
s_valueOfConfig=ValidateMultipleSaleableConfig
Reporter.ReportEvent 2, "#L_STEP3", "END"
'<End Step: #STEPNAME ------------------------------------>


'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP4", "BEGIN"
'Step4
'Desc: Click on Menu 2 and select Inventory, add the flight details and click on Search,Verify that it is not a blockspace flight from the Codeshare column which should show 0 for all classes,
'Note the Capacity count in the Cap and OCap columns and Availability count in the NAV and GAV columns 
 'Expected Result: Inventory screen is displayed for the flight,Codeshare column shows 0 for all classes,Cap and OCap count is noted,NAV and GAV is noted
 
wait 3
JavaWindow("wndInventory").Activate
JavaWindow("wndInventory").JavaCheckBox("chkInventoryManagement").Set "ON"
JavaWindow("wndInventory").JavaMenu("mnuInventory").Select
If JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").Exist Then
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").Activate
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").JavaEdit("txtFlightCode").Set environment.Value("PON_CARRIER1")
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").JavaEdit("txtFlightDate").Set environment.Value("PON_FlightDate1")
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").JavaEdit("txtFlightNo").Set environment.Value("PON_FLIGHT1")
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").JavaButton("btnSearch").Click
End If
Common_CaptureScreenshot "To check whether it's a blockspace flight",2
wordsOfConfig=split(s_valueOfConfig,"-")
Set myRegExp = New RegExp
'Create a regular expression object
's_InvConfigValue=wordsOfConfig(1)+wordsOfConfig(2)
s_InvConfigValue=wordsOfConfig(2)
myRegExp.Global = True
myRegExp.Pattern = "[^\d]"
'set the pattern to non-digital characters
s_Digits1 = myRegExp.Replace(wordsOfConfig(1), "")
'replace all non - digit characters by empty string.
s_Digits2 = myRegExp.Replace(wordsOfConfig(2), "")

'validation - verify that it is not a blockspace flight and note the capacity size. -
If JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"Codeshare")=0 and JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"Codeshare")=0 then
	Common_Report "The fligt is not a blockspace flight||Pass"
Else
	Common_Report "The fligt is a blockspace flight||Fail"
End If
s_row0=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"OCap"))
s_row1=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"OCap"))
s_NonFreez=s_row0+s_row1

s_rowOCap0_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"OCap"))
s_rowOCap1_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"OCap"))
s_rowC0_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"C"))
s_rowC1_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"C"))
s_row0_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"Cap"))
s_row1_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"Cap"))

s_rowNAV0_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"NAV"))
s_rowNAV1_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"NAV"))
s_rowGAV0_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"GAV"))
s_rowGAV1_old=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"GAV"))

Common_Report "OCap Count are "&s_rowOCap0_old&" and "&s_rowOCap1_old
Common_Report "Cap Count are "&s_row0_old&" and "&s_row0_old
Common_Report "NAV Count are "&s_rowNAV0_old&" and "&s_rowNAV1_old
Common_Report "GAV Count are "&s_rowGAV0_old&" and "&s_rowGAV1_old

Common_SimpleCompare s_rowC0_old&s_row0_old&s_rowC1_old&s_row1_old,"=",s_InvConfigValue&"~Validated updated new saleable config code changes J and Y cabins Cap capacity count in inventory~"
Common_SimpleCompare s_rowC0_old&s_rowOCap0_old&s_rowC1_old&s_rowOCap1_old,"=",s_InvConfigValue&"~Validated updated new saleable config code changes J and Y cabins OCap capacity count in inventory~"
Common_SimpleCompare s_rowC0_old&s_rowNAV0_old&s_rowC1_old&s_rowNAV1_old,"=",s_InvConfigValue&"~Validated updated new saleable config code changes J and Y cabins NAV capacity count in inventory~"
Common_SimpleCompare s_rowC0_old&s_rowGAV0_old&s_rowC1_old&s_rowGAV1_old,"=",s_InvConfigValue&"~Validated updated new saleable config code changes J and Y cabins GAV capacity count in inventory~"
Reporter.ReportEvent 2, "#L_STEP4", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP5", "BEGIN"
'Step 5
'Menu 3, Flight Date Seatmap,  perform a search for 7X40 AKL-SYD flight and check the Seatmap information for Free cabins shows 'none' to ensure that it is not free seating 
'Expected Result- The Seatmap Information table shows Free cabins: none 

JavaWindow("wndInventory").Activate
WAIT(3)
JavaWindow("wndInventory").JavaCheckBox("chkSeat").Set "ON"
JavaWindow("wndInventory").JavaMenu("mnuFlightDateSeatMap").Select
wait(5)

JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDateSeatmap").JavaEdit("txtFlightCarrier").Set environment.Value("e_AirlineCode")
JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDateSeatmap").JavaEdit("txtFlightNumber").Set environment.Value("e_FlightNo")
JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDateSeatmap").JavaEdit("txtDeparturedate").Set environment.Value("e_FlightDate")
JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDateSeatmap").JavaEdit("txtOrigin").Set environment.Value("PON_DEP1")
JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDateSeatmap").JavaEdit("txtDestination").Set environment.Value("PON_ARR1")
JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDateSeatmap").JavaButton("btnSearch").Click
s_staticText= Common_StripeHTML(JavaWindow("wndInventory").JavaInternalFrame("dlgFlightDateSeatmap").JavaStaticText("stSeatMapDescription").GetROProperty("attached text"))
Common_SimpleCompare "Free Cabins : none","IN",cStr(s_staticText)&"~The Seatmap Information shows 'none' for Free cabins~"
Reporter.ReportEvent 2, "#L_STEP5", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP6", "BEGIN"
'Step 6
'Go to Menu 1, Flight date Information, add the flight details and click on Search, On the Flight Date Information screen, click on Actions and Trigger DCS flight Create 
'Expected Result-Flight Date Information screen is displayed with 7X40 flight deatils, A pop-up is displayed with the info 'Altea DCS flight creation triggered.'

RunAction "Inv_TriggerFlight [Inv_TriggerFlight]", oneIteration
Reporter.ReportEvent 2, "#L_STEP6", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP7", "BEGIN"
'Step 7
'Return to CM and search for the flight again 
'Expected Result-
'Flight Information screen is displayed 
environment.Value("e_LoginAirLine")=environment.Value("e_AirlineCode")
RunAction "CM_Login [CM_Login]", oneIteration

Environment("e_FlightNumber")=environment.Value("e_FlightNo")
Environment("e_From")=environment.Value("PON_DEP1")
RunAction "CM_SearchFlight [CM_SearchFlight]", oneIteration
Reporter.ReportEvent 2, "#L_STEP7", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP8", "BEGIN"
'Step 8
'Go to Flight>DeparturePlan (AF7, SF7), Trigger the first activity of CPR feed via Update activity (F7), select the CPR feed and update the date to something prior to the current system date and click on Update  
'Expected Result-This should cause the CPR Feed to be triggered and the CPRs to be created
Common_CM_DPMActivity "2",True
Reporter.ReportEvent 2, "#L_STEP8", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP9", "BEGIN"
'Step 9
'Modify the Acceptance Status to be Open via the Flight Update Screen (SF2)
'Desc: The Flight Information screen is displayed,The Prime Flight component shows Acceptance Open,Flight Status Table component shows Acceptance Open

environment.Value("e_ListAndStatus")="Acceptance Status|OPEN"
RunAction "Action1 [Update_Flight]", oneIteration
JavaWindow("wndCM").Type micF5
wait 10
JavaWindow("wndCM").Type micF5
Reporter.ReportEvent 2, "#L_STEP9", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP10", "BEGIN"
'Step 10
'From the Flight Information Screen, note the Config and Cabin Capacity.
'Expected Result-
'Confirm that the Config & Cabin Capacity in CM matches the Cap and OCap in Altea INV 
'To do
i_Cols = JavaWindow("wndCM").JavaTable("tblAcceptanceOpen").GetROProperty("columns_names")
s_Cols=split(i_Cols,";")
For N = 3 To (UBound(s_Cols))-2
  row0= cStr(JavaWindow("wndCM").JavaTable("tblAcceptanceOpen").GetCellData(0,s_Cols(N)))
    s_CMConfigValue=s_CMConfigValue+s_Cols(N)+row0
 Next
'Validation 

If (instr(s_CMConfigValue,s_InvConfigValue&s_InvConfigValue) > -1) Then
	Common_Report "The capacity matches between Altea INV"&s_InvConfigValue&s_InvConfigValue&" and Altea CM "&s_CMConfigValue&"||Passed"
Else
	Common_Report "The capacity DOESN'T matches between Altea INV "&s_InvConfigValue&s_InvConfigValue&" and Altea CM "&s_CMConfigValue&"||Fail"
End If
RunAction "CM_CloseAllTab [CM_CloseAllTab]", oneIteration
Reporter.ReportEvent 2, "#L_STEP10", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP11", "BEGIN"
'Step 11
'Return to Altea INV, from the List of periods change the saleable config to a different one in the list.

JavaWindow("wndInventory").Activate
s_valueOfConfig2=UpdateToOtherSaleableConfig
wordsOfConfig=split(s_valueOfConfig2,"-")
s_InvConfigValue=wordsOfConfig(2)
Reporter.ReportEvent 2, "#L_STEP11", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP12", "BEGIN"
'Step 12
'Open Inventory and check the capacity and availability has been updated to match the new configuration
'Expected: Cap, OCap, NAV and GAV has been updated to the new configuration

wait 3
JavaWindow("wndInventory").Activate
Common_INVCloseAllTabs
wait 3
JavaWindow("wndInventory").JavaCheckBox("chkInventoryManagement").Set "ON"
JavaWindow("wndInventory").JavaMenu("mnuInventory").Select
If JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").Exist(3) Then
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").Activate
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").JavaEdit("txtFlightCode").Set environment.Value("PON_CARRIER1")
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").JavaEdit("txtFlightDate").Set environment.Value("PON_FlightDate1")
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").JavaEdit("txtFlightNo").Set environment.Value("PON_FLIGHT1")
	JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightDate").JavaButton("btnSearch").Click
End If

wait 2
s_rowOCap0_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"OCap"))
s_rowOCap1_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"OCap"))
s_rowC0_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"C"))
s_rowC1_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"C"))
s_row0_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"Cap"))
s_row1_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"Cap"))

s_rowNAV0_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"NAV"))
s_rowNAV1_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"NAV"))
s_rowGAV0_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(0,"GAV"))
s_rowGAV1_new=cStr(JavaWindow("wndInventory").JavaTable("tblFlightType").GetCellData(1,"GAV"))


Common_SimpleCompare s_rowC0_new&s_row0_new&s_rowC1_new&s_row1_new,"=",s_InvConfigValue&"~Validated updated new saleable config code changes J and Y cabins Cap capacity count in inventory~"
Common_SimpleCompare s_rowC0_new&s_rowOCap0_new&s_rowC1_new&s_rowOCap1_new,"=",s_InvConfigValue&"~Validated updated new saleable config code changes J and Y cabins OCap capacity count in inventory~"
Common_SimpleCompare s_rowC0_new&s_rowNAV0_new&s_rowC1_new&s_rowNAV1_new,"=",s_InvConfigValue&"~Validated updated new saleable config code changes J and Y cabins NAV capacity count in inventory~"
Common_SimpleCompare s_rowC0_new&s_rowGAV0_new&s_rowC1_new&s_rowGAV1_new,"=",s_InvConfigValue&"~Validated updated new saleable config code changes J and Y cabins GAV capacity count in inventory~"
Reporter.ReportEvent 2, "#L_STEP12", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP13", "BEGIN"
'Step 13
'Refresh the Flight Information Screen and confirm that the saleable config has changed.
'Expected Result-
'Confirm that the Config & Cabin Capacity in CM matches the Cap and OCap in Altea INV 

'Validation


RunAction "CM_SearchFlight [CM_SearchFlight]", oneIteration
JavaWindow("wndCM").Type micF5

Set myRegExp = New RegExp

i_Cols = JavaWindow("wndCM").JavaTable("tblAcceptanceOpen").GetROProperty("columns_names")
s_Cols=split(i_Cols,";")
s_row_c1=cStr(JavaWindow("wndCM").JavaTable("tblAcceptanceOpen").GetCellData(0,s_Cols(3)))
s_row_c2=cStr(JavaWindow("wndCM").JavaTable("tblAcceptanceOpen").GetCellData(0,s_Cols(4)))
For N = 3 To (UBound(s_Cols))-2
  row0= cStr(JavaWindow("wndCM").JavaTable("tblAcceptanceOpen").GetCellData(0,s_Cols(N)))
   s_CMConfigValue2=s_CMConfigValue2+s_Cols(N)+row0
 Next
'Validation 

If (instr(s_CMConfigValue,s_InvConfigValue&s_InvConfigValue) > -1) Then
	Common_Report "The capacity matches between Altea INV"&s_InvConfigValue&s_InvConfigValue&" and Altea CM"&s_CMConfigValue2&"||Passed"
Else
	Common_Report "The capacity DOESN'T matches between Altea INVINV"&s_InvConfigValue&s_InvConfigValue&" and Altea CM"&s_CMConfigValue2&"||Fail"
End If
wait(10) 'This wait is because history is taking time to reflect in CM

Reporter.ReportEvent 2, "#L_STEP13", "END"
'<End Step: #STEPNAME ------------------------------------>

'<Begin Step: #STEP ------------------------------------>
Reporter.ReportEvent 2, "#L_STEP14", "BEGIN"
'Step 14-
'Check Flight History (SF7, SF12) to ensure flight history was updated with the capacity change.
'Expected Result-
'Flight History screen is displayed, A Capacity Update is recorded for the new saleable config

JavaWindow("wndCM").JavaCheckBox("chkFlight").Set "ON"
JavaWindow("wndCM").JavaMenu("mnuFlightHistory").Select
Common_CMScreenCheck("Flight History")
If JavaWindow("wndCM").JavaDialog("dlgRefineFlightHistory").Exist(5) Then
	JavaWindow("wndCM").JavaDialog("dlgRefineFlightHistory").JavaButton("btnOk").Click
End If
wait(5)

''Common_SelectRow "wndCM","tblFlightHistorySelectionTable","Event Description|Capacity Update"
s_MaxRow=JavaWindow("wndCM").JavaTable("tblFlightHistorySelectionTable").GetROProperty("rows")-1

Do While  s_MaxRow>0
	If JavaWindow("wndCM").JavaTable("tblFlightHistorySelectionTable").GetCellData(s_MaxRow,4)="Capacity Update" Then
 		JavaWindow("wndCM").JavaTable("tblFlightHistorySelectionTable").SelectRow s_MaxRow
		Exit Do
	End If	
	s_MaxRow=s_MaxRow-1
Loop 

wait(5)

set obj =JavaWindow("wndCM").JavaObject("objFlightHistoryDetailsComponent").ChildObjects()
s_HistoryText = obj(8).toString()
Set RegEx = CreateObject("vbscript.regexp")  
With RegEx  
   			.Global = True  
   			.IgnoreCase = True  
   			.MultiLine = True  
			.Pattern = "(&raquo;)|(&nbsp;)|(<[^>]+>)|(&raquo)" 'Regular Expression to Remove HTML Tags.  
			End With 
sOutFrHistory = RegEx.Replace(s_HistoryText,"")
wait(5)

Common_SimpleCompare "Capacity:"+s_row0+"->"+s_row_c1,"IN",sOutFrHistory
Common_SimpleCompare "Cabin:"&environment.Value("PON_CapB1")&"Capacity:"+s_row1+"->"+s_row_c2,"IN",sOutFrHistory
Reporter.ReportEvent 2, "#L_STEP14", "END"
'<End Step: #STEPNAME ------------------------------------>

'post Conditions 

RunAction "Inv_Logout [Inv_Logout]", oneIteration
RunAction "CM_Exit [CM_Exit]", oneIteration






Function ValidateMultipleSaleableConfig
	'''Update Saleable config

environment.Value("e_ConfigCode")=environment.Value("PON_ConfigA1")
if JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Exist(100) then
   wait 5
	JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Set "ON" 
	JavaWindow("wndInventory").JavaMenu("mnuListOfPeriods").Select
	If JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").Exist(100) Then
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").Activate
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtAirlineCode").Set environment.Value("e_AirlineCode")
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtFlightRanges").Set environment.Value("e_FlightNo")
		'JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtStartDate").Click
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtStartDate").Set environment.Value("e_FlightDate")
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtEndDate").Set environment.Value("e_FlightDate")

		Common_CaptureScreenshot "Data Entered in Date Field of Search Flight period dialogue",2
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaButton("btnSearch").Click
		If JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").Exist(100) Then
			JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaCheckBox("chkUpdate").Set "ON"
			JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaMenu("mnuUpdatePeriod").Select
			wait(5)
			If JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").Exist(100) Then
			
			config=JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaEdit("txtConfigCode").GetROProperty("text")
				
				JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaButton("btnConfigCode").Click
				wait 10
				If JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaList("lstSaleableConfig").GetROProperty("items count")>=2 and config= environment.Value("e_ConfigCode") Then
					Common_Report "Config code has multiple saleable configuration||Passed"
					JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaButton("btnOK").Click
					wait 5
					configValue=JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaEdit("txtFrequency").GetROProperty("text")
				Else
				    JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaButton("btnOK").Click
				    JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").Activate
				    environment.Value("e_ConfigCode")=environment.Value("PON_ConfigA1")
					JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaEdit("txtConfigCode").Set environment.Value("e_ConfigCode")
					JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaButton("btnApplyRouting").Click
					wait(5)
					Common_CaptureScreenshot "Apply Routing",2
					''Again validate that config code has multiple saleable config code
					JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaButton("btnConfigCode").Click
					wait 10
					If JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaList("lstSaleableConfig").GetROProperty("items count")>=2 Then
						Common_Report "Validating that it has multiple saleable configuration||Passed"
						JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaButton("btnOK").Click
						wait 5
						JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaButton("btnApplyRouting").Click
						wait(5)
						Common_CaptureScreenshot "Apply Routing",2
						configValue=JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaEdit("txtFrequency").GetROProperty("text")
						environment.Value("e_ConfigValue")=configValue
						JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaButton("btnSave").Click
						wait(5)
						'Click Refresh
						Common_CaptureScreenshot "New Routing is applied",2
						Do Until JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaTable("tblDisplayMode").GetCellData(0,"Lock")="false"
							JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaButton("btnRefresh").Click
							wait 5
						Loop 
					Else
					    Common_Report "It does not have multiple saleable configuration both congif code which are provided in PON sheet||Failed"
					    exittest
					End If
				End If  
			Else
		
			Common_Report "The window of Update of  Periods is Not open||Fail"
			End If
		else
			Common_Report "The window of List of  Periods is Not open||Fail"
		End If
		If True Then
			
		End If
		JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaButton("btncloseIcon").Click
    else
		Common_Report "The window of Search Flight Periods is Not open||Fail"
	End If
	
	else
	Common_Report "The inventory window is not opened||Fail"
End If

ValidateMultipleSaleableConfig=configValue
End Function


Function UpdateToOtherSaleableConfig
	'''Update Saleable config

if JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Exist(100) then
   wait 5
	JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Set "ON" 
	JavaWindow("wndInventory").JavaMenu("mnuListOfPeriods").Select
	If JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").Exist(100) Then
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").Activate
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtAirlineCode").Set environment.Value("e_AirlineCode")
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtFlightRanges").Set environment.Value("e_FlightNo")
		'JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtStartDate").Click
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtStartDate").Set environment.Value("e_FlightDate")
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaEdit("txtEndDate").Set environment.Value("e_FlightDate")

		Common_CaptureScreenshot "Data Entered in Date Field of Search Flight period dialogue",2
		JavaWindow("wndInventory").JavaInternalFrame("dlgSearchFlightPeriods").JavaButton("btnSearch").Click
		If JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").Exist(100) Then
			JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaCheckBox("chkUpdate").Set "ON"
			JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaMenu("mnuUpdatePeriod").Select
			wait(5)
			If JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").Exist(100) Then
					JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").Activate
					JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaButton("btnConfigCode").Click
				   '''Change saleable config code
				   JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").Activate
				   wait(3)
					sValue=JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaList("lstSaleableConfig").GetROProperty("value")
					sValueIndex= JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaList("lstSaleableConfig").GetItemIndex(sValue)
					If sValueIndex=0 Then
						 sNewValue= JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaList("lstSaleableConfig").GetItem("1")
						 JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaList("lstSaleableConfig").Select(sNewValue)
					Else
						sNewValue= JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaList("lstSaleableConfig").GetItem("0")
						JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaList("lstSaleableConfig").Select(sNewValue)
					End If
					Common_Report "New Saleable config changed to "&sNewValue&"||Pass"
					wait 3
					JavaWindow("wndInventory").JavaInternalFrame("Configuration Dialog").JavaButton("btnOK").Click
					wait 5
					JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaButton("btnApplyRouting").Click
					wait(5)
					Common_CaptureScreenshot "Apply Routing",2
					configValue=JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaEdit("txtFrequency").GetROProperty("text")
					environment.Value("e_ConfigValue")=configValue
					JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaButton("btnSave").Click
					wait(5)
					'Click Refresh
					Common_CaptureScreenshot "New Routing is applied",2
					Do Until JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaTable("tblDisplayMode").GetCellData(0,"Lock")="false"
					 JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaButton("btnRefresh").Click
					 wait 5
					Loop 
			Else
		
			Common_Report "The window of Update of  Periods is Not open||Fail"
			End If
		else
			Common_Report "The window of List of  Periods is Not open||Fail"
		End If
		JavaWindow("wndInventory").JavaInternalFrame("wndListOfPeriods").JavaButton("btncloseIcon").Click
    else
		Common_Report "The window of Search Flight Periods is Not open||Fail"
	End If
	
	else
	Common_Report "The inventory window is not opened||Fail"
End If

UpdateToOtherSaleableConfig=configValue
End Function















