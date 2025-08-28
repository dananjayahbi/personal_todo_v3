Dim objShell, objFSO
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
Dim currentDir, parentDir, wrapperPath
currentDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
parentDir = objFSO.GetParentFolderName(currentDir)
wrapperPath = currentDir & "\start_silent.py"

' Change to parent directory and run the silent wrapper
objShell.CurrentDirectory = parentDir
objShell.Run "python """ & wrapperPath & """", 0, False

Set objShell = Nothing
Set objFSO = Nothing
