#------------------------------------------------------------------------------------------------------------
#Written by sanjeeth.nayak@amadeus.com on 23/04/2020
#TTS call Documentation:https://rndwww.nce.amadeus.net/confluence/display/ADB/CyberArk+Call+in+TTS+scripts
#Additional Technical Doc: https://rndwww.nce.amadeus.net/confluence/display/CSSQTPTSTMS/%5BCyberArk%5D+Technical+Documentation
#------------------------------------------------------------------------------------------------------------
import subprocess
import os
import re

'''
CyberArkPowerShellCall accepts AppID,SafeID and Vault object address and returns the password string
'''
def CyberArkPowerShellCall(s_AppID,s_Safe,s_ObjectAddress):
    s_CyberarkCallString = 'Set-ExecutionPolicy -ExecutionPolicy Undefined -Scope CurrentUser'
    #s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$url=" + chr(34) + "https://pimapi.amadeus.com/AIMWebService/Win_Auth/AIM.asmx" + chr(34)
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$url=" + chr(34) + "https://ncepim14.iis.amadeus.net/AIMWebService/Win_Auth/AIM.asmx" + chr(34)
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12"
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$proxy = New-WebServiceProxy -Uri $url -UseDefaultCredential"
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$namespace = $proxy.getType().namespace"
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$request = New-Object ($namespace + " + chr(34) + ".passwordRequest" + chr(34) + ")"
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$request.AppID = " + chr(34) + s_AppID + chr(34) + ";"
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$request.Query = " + chr(34) + "Object=" + s_ObjectAddress + ";Safe=" + s_Safe + chr(34) + ";"
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$response = $proxy.GetPassword($request)"
    s_CyberarkCallString = s_CyberarkCallString + chr(10) + "$response.content"
    drive = "/mnt/c/"
    if not (os.path.exists("/mnt/c/")):
        drive = "C:/"
    os.chdir(drive + "TESTRESOURCES/DirectTTSInjector/")
    print("Current Working Dir: " + str(os.getcwd()))
    PSfile = open("CyberArkPS.ps1", "w")
    PSfile.write(s_CyberarkCallString)
    PSfile.close()
    PSfilePath =  os.getcwd() + '\\CyberArkPS.ps1'
    PSfilePath = "-File " + chr(34) + PSfilePath.replace("/mnt/c","c:").replace("/mnt/d","d:").replace("/","\\") + chr(34)
    print("-----------------Running Cyberark Call function using Powershell "+ PSfilePath)
    PSCommand = 'powershell.exe -executionpolicy bypass ' + "-File CyberArkPS.ps1"
    print("-----------------PS path: "+ PSCommand)
    PSRun = subprocess.Popen(PSCommand, stdout=subprocess.PIPE, shell=True)
    #PSReturnStr = str(PSRun.communicate()[0], 'UTF-8').replace('\n',"").replace('\r',"")
    try:
        passwd = PSRun.communicate()[0]
        PSReturnStr = str(passwd, 'UTF-8').replace('\n',"").replace('\r',"")
    except:
        PSReturnStr = str(passwd).replace('\n',"").replace('\r',"")
    if 'FullyQualifiedErrorId : SoapException' in PSReturnStr:
        print(PSReturnStr)
    if 'FullyQualifiedErrorId : SoapException' in PSReturnStr:
        print(PSReturnStr)
    else:
        print("-----------------Successfully Retriewed the Password from Cyberark using following parameters-> AppID:[" + s_AppID + "]" + "SafeID:[" + s_Safe +"Object:["+s_ObjectAddress +"]")
        return PSReturnStr


'''
PasswordCleanup accepts password string and cleans up password in associated .log and .rex files
'''
def PasswordCleanup(password):
    password = str(password)
    logPath = os.getcwd()
    logfiles = os.listdir(logPath)
    for eachlogfiles in logfiles:
        if ('.log' in eachlogfiles[-4:]) or ('.rex' in eachlogfiles[-4:]):
            print("-----------------Concealing password for:"+ logPath +'/'+eachlogfiles)
            readlogfile = open(logPath +'/'+eachlogfiles,'r')
            readlogdata = readlogfile.read()
            readlogfile.close
            filedata = conceal(readlogdata,password)
            logfile = open(logPath +'/'+eachlogfiles,'w')
            logfile.write(filedata)
            logfile.close


'''
Below method is taken from https://rndwww.nce.amadeus.net/git/projects/PNRQA/repos/pdf_generic_library/browse/pwd_lib.py
'''
def conceal(filedata, pwd, filename="no filename provided for debugging"):
    """given filedata, perform the transformations due to password concealment

       Note: this method is not public

    :Non-keyword arguments:
        - filedata -- the buffer of the file to be cleaned
        - pwd -- value of the password to be hidden
        - filename -- only used for debugging

    """

    # We need to keep the same string length to not destroy the .rex while it is still open

    # init for concealment in .rex
    pwd_rex1 = ""; concealedpwd1 = ""
    pwd_rex2 = ""; concealedpwd2 = ""

    # init for concealment in .log
    pwd_log = ""

    # dictionnary of special characters
    specials = {
            "&":{"replace1":"\&amp;", "replace2":"&amp;", "replace3":"\&"},
            "<":{"replace1":"&lt;", "replace2":"&lt;", "replace3":"<"},
            ">":{"replace1":"&gt;", "replace2":"&gt;", "replace3":">"},
            "'":{"replace1":"&apos;", "replace2":"&apos;", "replace3":"'"},
            '"':{"replace1":"&quot;", "replace2":"&quot;", "replace3":'"'}}

    # inspect each character of the password
    for character in pwd:

        # if special XML escaped character
        if character in specials:
            
            #append replacement to first pattern in  .rex
            pwd_rex1 = pwd_rex1 + specials[character]["replace1"]
            #append the exact same number of * in concealpwd1
            concealedpwd1 = concealedpwd1 + ("*" * len(specials[character]["replace1"]))

            #append replacement to second pattern in .rex
            pwd_rex2 = pwd_rex2 + specials[character]["replace2"]
            #append the exact same number of * in concealpwd2
            concealedpwd2 = concealedpwd2 + ("*" * len(specials[character]["replace2"]))

            #append replacement to first pattern in .log (length of concealment does not hurt here so we will use concealedpwd1)
            pwd_log = pwd_log + specials[character]["replace3"]

        # not an XML escaped character
        else:
            pwd_rex1 = pwd_rex1 + character
            pwd_rex2 = pwd_rex2 + character
            concealedpwd1 = concealedpwd1 + "*"
            concealedpwd2 = concealedpwd2 + "*"
            pwd_log = pwd_log + character

    pwd_rex1 = str(pwd_rex1)
    pwd_rex2 = str(pwd_rex2)
    pwd_log = str(pwd_log)
    pwd = str(pwd)

    
    if pwd_rex1 in filedata:
        filedata = filedata.replace(pwd_rex1, concealedpwd1)
    if pwd_rex2 in filedata:
        filedata = filedata.replace(pwd_rex2, concealedpwd2)
    if pwd_log in filedata:
        filedata = filedata.replace(pwd_log, concealedpwd1)
    if pwd in filedata:
        filedata = filedata.replace(pwd, concealedpwd1)
	
    return filedata
	