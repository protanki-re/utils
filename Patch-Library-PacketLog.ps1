param(
  [Parameter(Mandatory=$true)] [string] $InputFile,
  [Parameter(Mandatory=$true)] [string] $OutputFile,
  [string] $FFDec = 'C:\Program Files (x86)\FFDec\ffdec.jar',
  [string] $LogFile = 'packets.txt'
)

function New-TemporaryDirectory {
  $parent = [System.IO.Path]::GetTempPath()
  [string] $name = [System.Guid]::NewGuid()
  New-Item -ItemType Directory -Path (Join-Path $parent $name)
}

Write-Output ">>> Patching $InputFile -> $OutputFile"

$TemporaryDirectory = New-TemporaryDirectory
Write-Output ">>> Temporary directory: $TemporaryDirectory"

java -jar $FFDec -selectclass scpacker.networking.NetworkService -format script:pcode -export script $TemporaryDirectory $InputFile

$NetworkServiceScriptLocation = Join-Path $TemporaryDirectory 'scripts/scpacker/networking/NetworkService.pcode'
$NetworkServiceScript = Get-Content $NetworkServiceScriptLocation -Raw

$SwfIntermediateLocation = Join-Path $TemporaryDirectory 'intermediate.swf'

# NetworkService
$MethodStartString = 'trait method QName(PackageNamespace(""),"protocolDecrypt")'
$MethodEndString = 'end ; method'

$MethodStart = $NetworkServiceScript.IndexOf($MethodStartString)
$MethodEnd = $NetworkServiceScript.IndexOf($MethodEndString, $MethodStart)

$Method = $NetworkServiceScript.Substring($MethodStart, ($MethodEnd + $MethodEndString.Length) - $MethodStart)

$OldMethod = $Method
$Method = $Method -Replace 'maxstack\s+\d+', 'maxstack 32'
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to change maxstack"
} else {
  Write-Output ">>> Changed maxstack to 32"
}

$OldMethod = $Method
$Method = $Method -Replace 'localcount\s+\d+', 'localcount 32'
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to change localcount"
} else {
  Write-Output ">>> Changed localcount to 32"
}

$OldMethod = $Method
$Method = $Method -Replace '()(getlocal0\r?\n\s*getlocal\s+9\r?\n\s*callproperty\s+QName\(PackageNamespace\(""\),"sendRequestToAllListeners"\), 1)', "`${1}
findpropstrict      QName(PackageNamespace(`"flash.filesystem`"),`"FileStream`")
constructprop       QName(PackageNamespace(`"flash.filesystem`"),`"FileStream`"), 0
setlocal            14

getlocal            14
findpropstrict      QName(PackageNamespace(`"flash.filesystem`"),`"File`")
getproperty         QName(PackageNamespace(`"flash.filesystem`"),`"File`")
getproperty         QName(PackageNamespace(`"`"),`"desktopDirectory`")
pushstring          `"$LogFile`"
callproperty        QName(PackageNamespace(`"`"),`"resolvePath`"), 1
coerce              QName(PackageNamespace(`"flash.filesystem`"),`"File`")
findpropstrict      QName(PackageNamespace(`"flash.filesystem`"),`"FileMode`")
getproperty         QName(PackageNamespace(`"flash.filesystem`"),`"FileMode`")
getproperty         QName(PackageNamespace(`"`"),`"APPEND`")
callproperty        QName(PackageNamespace(`"`"),`"open`"), 2
pop

getlocal            14
pushstring          `"\nRECEIVED: `"
getlocal            9
getproperty         QName(PackageNamespace(`"`"),`"type`")
callproperty        QName(PackageNamespace(`"`"),`"toString`"), 0
add
pushstring          `";`"
add
getlocal            9
getproperty         QName(PackageNamespace(`"`"),`"args`")
pushstring          `";`"
callproperty        QName(Namespace(`"http://adobe.com/AS3/2006/builtin`"),`"join`"), 1
add
callproperty        QName(PackageNamespace(`"`"),`"writeUTFBytes`"), 1
pop

getlocal            14
callproperty        QName(PackageNamespace(`"`"),`"close`"), 0
pop
`${2}"
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to inject received command logging"
} else {
  Write-Output ">>> Injected received command logging"
}

Set-Content -Path $NetworkServiceScriptLocation $Method
# Write-Output $Method

Write-Output ">>> Patching SWF file (NetworkService)..."
java -jar $FFDec -replace $InputFile $SwfIntermediateLocation scpacker.networking.NetworkService $NetworkServiceScriptLocation 3

java -jar $FFDec -selectclass scpacker.networking.Network -format script:pcode -export script $TemporaryDirectory $InputFile

$NetworkScriptLocation = Join-Path $TemporaryDirectory 'scripts/scpacker/networking/Network.pcode'
$NetworkScript = Get-Content $NetworkScriptLocation -Raw

# Network
$MethodStartString = 'trait method QName(PackageNamespace(""),"send")'
$MethodEndString = 'end ; method'

$MethodStart = $NetworkScript.IndexOf($MethodStartString)
$MethodEnd = $NetworkScript.IndexOf($MethodEndString, $MethodStart)

$Method = $NetworkScript.Substring($MethodStart, ($MethodEnd + $MethodEndString.Length) - $MethodStart)

$OldMethod = $Method
$Method = $Method -Replace 'maxstack\s+\d+', 'maxstack 32'
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to change maxstack"
} else {
  Write-Output ">>> Changed maxstack to 32"
}

$OldMethod = $Method
$Method = $Method -Replace 'localcount\s+\d+', 'localcount 32'
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to change localcount"
} else {
  Write-Output ">>> Changed localcount to 32"
}

$OldMethod = $Method
$Method = $Method -Replace '()(getlocal0\r?\n\s*getproperty\s+QName\(PackageNamespace\(""\),"AESDecrypter"\))', "`${1}
findpropstrict      QName(PackageNamespace(`"flash.filesystem`"),`"FileStream`")
constructprop       QName(PackageNamespace(`"flash.filesystem`"),`"FileStream`"), 0
setlocal            14

getlocal            14
findpropstrict      QName(PackageNamespace(`"flash.filesystem`"),`"File`")
getproperty         QName(PackageNamespace(`"flash.filesystem`"),`"File`")
getproperty         QName(PackageNamespace(`"`"),`"desktopDirectory`")
pushstring          `"$LogFile`"
callproperty        QName(PackageNamespace(`"`"),`"resolvePath`"), 1
coerce              QName(PackageNamespace(`"flash.filesystem`"),`"File`")
findpropstrict      QName(PackageNamespace(`"flash.filesystem`"),`"FileMode`")
getproperty         QName(PackageNamespace(`"flash.filesystem`"),`"FileMode`")
getproperty         QName(PackageNamespace(`"`"),`"APPEND`")
callproperty        QName(PackageNamespace(`"`"),`"open`"), 2
pop

getlocal            14
pushstring          `"\nSENT   : `"
getlocal            1
add
callproperty        QName(PackageNamespace(`"`"),`"writeUTFBytes`"), 1
pop

getlocal            14
callproperty        QName(PackageNamespace(`"`"),`"close`"), 0
pop
`${2}"
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to inject sent command logging"
} else {
  Write-Output ">>> Injected sent command logging"
}

Set-Content -Path $NetworkScriptLocation $Method
# Write-Output $Method

Write-Output ">>> Patching SWF file (Network)..."
java -jar $FFDec -replace $SwfIntermediateLocation $OutputFile scpacker.networking.Network $NetworkScriptLocation 6

Write-Output ">>> Removing temporary directory..."
# Remove-Item -Recurse -Force $TemporaryDirectory

Write-Output ">>> Done! Output file: $OutputFile"
