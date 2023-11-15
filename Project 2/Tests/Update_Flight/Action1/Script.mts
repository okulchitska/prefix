'----------------------------------------------------------------------------------------------------------------------------------------------------
'# Re-usable action :Update_Flight
'
'	Objective:	To update the Acceptance status as per the input provided. Future Verify the Acceptance Status in Flight Status Table,Flight banner and verify the Update message
'   Input: environment.Value("e_ListAndStatus")  e.g environment.Value("Acceptance Status|OPEN") 
'	~ Output : Update test case as pass or fail
'  
'	@author		:   Rupawati,Ravi kumar
'	@copyright	:  	2018 Amadeus Services Limited. All rights reserved.
'	@contact	:   Rupawathi.BOKKA@amadeus.com,ravi.kumar@amadeus.com
'	@deffield	:   Created:28/08/2018  | Last Updated: Ravi Kumar
'
'-----------------------------------------------------------------------------------------------------------------------------------------------------

Dim a_ListAndStatus
Dim lstname


e_ListItemName=environment.Value("e_ListAndStatus") 

a_ListAndStatus=split(e_ListItemName,"|")

	
Common_CMScreenCheck("Flight Information")

JavaWindow("wndCM").JavaButton("btnFlightUpdate").Click @@ hightlight id_;_3911309_;_script infofile_;_ZIP::ssf4.xml_;_
 @@ hightlight id_;_29567759_;_script infofile_;_ZIP::ssf5.xml_;_
if Common_CMScreenCheck("Flight Update") then
        Select Case a_ListAndStatus(0)
         Case "Acceptance Status"
         lstname="lstAcceptanceStatus"
         Case else
         Common_Report "Please Select the appropriate weblist||Fail"
         ExitSelect
         End select
	                            
	 	strSelected=JavaWindow("wndCM").JavaList(lstname).GetROProperty("value")
	 	if strSelected=Ucase(a_ListAndStatus(1)) THEN
	 		Common_Report "The Acceptance status is already "&strSelected
	 		JavaWindow("wndCM").JavaButton("btnExit").Click
        End iF
	 	if not strSelected=Ucase(a_ListAndStatus(1)) THEN
 			 JavaWindow("wndCM").JavaList(lstname).Select Ucase(a_ListAndStatus(1))
          ' The validation part if the selectList is Selected with proper status or not.
           strSelected=JavaWindow("wndCM").JavaList(lstname).GetROProperty("value")
           intCompare = StrComp(a_ListAndStatus(1),strSelected, vbTextCompare)
           s_RequiredStatus=a_ListAndStatus(1)
               If intCompare = 0 Then
               Common_Report "The Acceptance status is selected as "& s_RequiredStatus&"||Pass"
               Else
               Common_Report "The status is not selected accordingly.Please check||Fail"
               End If
           JavaWindow("wndCM").JavaButton("btnUpdate").Click
           Common_CMScreenCheck("Flight Information")
           Common_CMMessageAreaCheck("Acceptance Status has been changed to "& Ucase(a_ListAndStatus(1)))
           If a_ListAndStatus(0) = "Acceptance Status" Then
               'To the Acceptance status is corrected update in the Flight status table 
	           s_Status=UCase(Left(a_ListAndStatus(1), 1)) &  Lcase(Mid(a_ListAndStatus(1), 2))
			   Common_ValidateTableValues "wndCM","tblFlightStatus","Row(0)","Acceptance|"&s_Status
                
                'To verify the Flight banner Acceptance status is updated.
				s_AccStatus=JavaWindow("wndCM").JavaStaticText("stsAcceptanceStatus").GetROProperty ("attached text")
				if Common_SimpleCompare("Acceptance "&s_Status,"=",s_AccStatus &"~Validation: Flight banner acceptance status Validation is done.~") then
				   Common_Report "Flight banner show acceptance as "&s_AccStatus&"|Flight banner|PASS"
				Else
				   Common_Report "Flight banner show acceptance as "&s_AccStatus&"|Flight banner|Fail"
				End if
			   
           End If
          
           ELSE
           Common_Report "The status is with updated Status"
           End If 
         
      
Else
 Common_Report "The page Flight update is not launched||Fail"

End If



