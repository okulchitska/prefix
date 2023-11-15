'----------------------------------------------------------------------------------------------------------------------------------------------------
'	# Reusable Action Inv_TriggerFlight
'
' 		~ This Action triggers the required flight from inventory.

'		~ Usage	 : Direct run or RunAction "Inv_TriggerFlight [Inv_TriggerFlight]", oneIteration 
' 		~ Input  : Airline Code, Flight no and Flight date should be passed as environment variable. Below are e.g
'                   environment.Value("e_AirlineCode")
'					environment.Value("e_FlightNo")
'					environment.Value("e_FlightDate")
'		~ Output : Inv_TriggerFlight true or false
'
'	@author		:   Ravi kumar
'	@copyright	:  	2018 Amadeus Services Limited. All rights reserved.
'	@contact	:   ravi.kumar@amadeus.com
'	@deffield	:   Created:9/04/2018  | Last Updated: 
'----------------------------------------------------------------------------------------------------------------------------------------------------

'Varibale initialisation
s_AirlineCode=environment.Value("e_AirlineCode")
s_FlightNo=environment.Value("e_FlightNo")
s_FlightDate=environment.Value("e_FlightDate")

'//Adding year at the end of date. E.g if input is 13FEB the append year to make it 13FEB18
s_MonthMMM=UCase(right(s_FlightDate,3))
s_TimeStampDate= Now()
s_year=Year(s_TimeStampDate)
s_month=monthname(month(s_TimeStampDate))
s_monthNow=UCase(Left(s_month,3))
s_YearYY=right(s_year,2)
s_YearNextYear=s_YearYY+1

If len(s_FlightDate)<=6 Then
	If s_monthNow="DEC" and s_MonthMMM <> "DEC" Then
		s_FlightDateDDMMYY=s_FlightDate & s_YearNextYear
	Else 
	   s_FlightDateDDMMYY=s_FlightDate & s_YearYY
	End If
Else
	s_FlightDateDDMMYY=s_FlightDate
End If	


If JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Exist(10) then
   JavaWindow("wndInventory").JavaCheckBox("chkFlightShedule").Set "ON"
   JavaWindow("wndInventory").JavaMenu("mnuFlightDateInformation").Select
   wait 3
   If JavaWindow("wndInventory").JavaInternalFrame("wndSearchFlightDateOperational").Exist Then
       	  
          JavaWindow("wndInventory").JavaInternalFrame("wndSearchFlightDateOperational").JavaEdit("txtAirlineCode").Set s_AirlineCode
          JavaWindow("wndInventory").JavaInternalFrame("wndSearchFlightDateOperational").JavaEdit("txtFlightNo").Set s_FlightNo       
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
		             'JavaWindow("wndInventory").JavaMenu("mnuFile").JavaMenu("mnuExit").Select
		             environment.Value("Inv_TriggerFlight")=True
	             Else
	  		 	    call Common_CaptureScreenshot("wndInformation does not exit",0)
	  		 	    environment.Value("Inv_TriggerFlight")=False
		
		         End If
	      Else
	  		 	call Common_CaptureScreenshot("wndFlightDateInformation does not exit",0)
	  		 	environment.Value("Inv_TriggerFlight")=False
	      End If     
	        
    Else
		 	call Common_CaptureScreenshot("wndSearchFlightDateOperational does not exit",0)
		 	environment.Value("Inv_TriggerFlight")=False
    End If
Else
	call Common_CaptureScreenshot("We are not in the Correct Window",0)
	environment.Value("Inv_TriggerFlight")=False
End If




