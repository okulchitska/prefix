@echo on
setlocal EnableDelayedExpansion

IF EXIST "C:\TTServerAAF\tts_version" (
set TTSERVER_HOME="C:\TTServerAAF\TTServer"
set TESTPATH="C:\TESTRESOURCES\DirectTTSInjector\TTSConfig.py"
call !TTSERVER_HOME! -pv 3 -s !TESTPATH!
) ELSE (
set TTSERVER_HOME="D:\Devsup\TTServer\TTServer"
set TESTPATH="C:\TESTRESOURCES\DirectTTSInjector\TTSConfig.py"
call !TTSERVER_HOME! -s !TESTPATH!
)
