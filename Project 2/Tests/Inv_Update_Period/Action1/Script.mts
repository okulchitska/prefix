'----------------------------------------------------------------------------------------------------------------------------------------------------
'	# Reusable Action Inv_Update_Period
'
' 		~ This Action updates the configuration in List of Periods of particular Flight. Inventory should be Logged In prior to perform this action.

'		~ Usage	 : Direct run or RunAction "Inv_Update_Period [Inv_Update_Period]", oneIteration 
' 		~ Input  : Airline code,Environment(pdt,uat etc) and flight date should be passed as environment variable. Below are e.g
'                  
'					environment.Value("e_FlightNo")
'					environment.Value("e_AirlineCode")
'                   environment.Value("e_FlightDate")
'		            environment.Value("e_ConfigCode")
'
'	@author		:   Rupa
'	@copyright	:  	2017 Amadeus Services Limited. All rights reserved.
'	@contact	:   rupawathi.BOKKA@amadeus.com
'	@deffield	:   Created:05/09/2018  | Last Updated: 
'----------------------------------------------------------------------------------------------------------------------------------------------------
'-------------------------------------------------------------------------------------------------------------------------------------------
'This is Auto Generated GATI script from ALM  

'Initialization
'Common_Init
'-------------------------------------------------------------------------------------------------------------------------------------------
Dim configValue

'Your Script Starts from Here ->
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
				JavaWindow("wndInventory").JavaInternalFrame("wndUpdateFlightPeriod").JavaEdit("txtConfigCode").Set environment.Value("e_ConfigCode")
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
			else
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



