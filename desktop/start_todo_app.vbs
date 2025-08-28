Dim objShell, objFSO
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
Dim currentDir, parentDir, launcherPath
currentDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
parentDir = objFSO.GetParentFolderName(currentDir)
launcherPath = currentDir & "\launcher.py"

' Change to parent directory and run the Python launcher silently
objShell.CurrentDirectory = parentDir
objShell.Run "pythonw """ & launcherPath & """", 0, False

Set objShell = Nothing
Set objFSO = Nothing
