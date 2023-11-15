'----------------------------------------------------------------------------------------------------------------------------------------------------
'#  Reusable Action CM_SearchFlight 
'
' 		~ This Reusable Action help search flight

'       ~ Input  : Environment variables  e_AirlineCode, e_FlightDate ,e_FlightNumber and e_From
'		~ Output : Update Action as pass or fail
'
'	@author		:   Sanjeeth Nayak
'	@copyright	:  	2018 Amadeus Services Limited. All rights reserved.
'	@contact	:   
'	@deffield	:   Created:26/12/2017  | Last Updated: 22/11/2018 by Ravi Kumar (ravi.kumar@amadeus.com)
'
'-----------------------------------------------------------------------------------------------------------------------------------------------------


JavaWindow("wndCM").JavaMenu("mnuApplications").highlight
JavaWindow("wndCM").JavaMenu("mnuApplications").JavaMenu("mnuFlight").Select

Common_CMScreenCheck("Enter Flight")

JavaWindow("wndCM").JavaEdit("txtAirlineCode").Set Environment("e_LoginAirLine")
JavaWindow("wndCM").JavaEdit("txtDate").Set Environment("e_FlightDate")
JavaWindow("wndCM").JavaEdit("txtFlightNumber").Set Environment("e_FlightNumber")
JavaWindow("wndCM").JavaEdit("txtAirportFrom").Set Environment("e_From")
call Common_CaptureScreenshot("Flight data entered",2)
JavaWindow("wndCM").JavaButton("btnDisplay").Click @@ hightlight id_;_7419104_;_script infofile_;_ZIP::ssf12.xml_;_

 @@ hightlight id_;_13574974_;_script infofile_;_ZIP::ssf43.xml_;_
If JavaWindow("wndCM").JavaButton("btnAcceptanceFigures").Exist(20) Then
	Common_CaptureScreenshot "Flight Search Complete",1
else
	Common_CaptureScreenshot "Flight Search Failed",0
End If
