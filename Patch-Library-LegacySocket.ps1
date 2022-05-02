param(
  [Parameter(Mandatory=$true)] [string] $InputFile,
  [Parameter(Mandatory=$true)] [string] $OutputFile,
  [string] $FFDec = 'C:\Program Files (x86)\FFDec\ffdec.jar'
)

function New-TemporaryDirectory {
  $parent = [System.IO.Path]::GetTempPath()
  [string] $name = [System.Guid]::NewGuid()
  New-Item -ItemType Directory -Path (Join-Path $parent $name)
}

Write-Output ">>> Patching $InputFile -> $OutputFile"

$TemporaryDirectory = New-TemporaryDirectory
Write-Output ">>> Temporary directory: $TemporaryDirectory"

java -jar $FFDec -selectclass Game -format script:pcode -export script $TemporaryDirectory $InputFile

$ScriptLocation = Join-Path $TemporaryDirectory 'scripts/Game.pcode'
$Script = Get-Content $ScriptLocation -Raw

$MethodStartString = 'trait method QName(PackageNamespace(""),"activateAllModels")'
$MethodEndString = 'end ; method'

$MethodStart = $Script.IndexOf($MethodStartString)
$MethodEnd = $Script.IndexOf($MethodEndString, $MethodStart)

$Method = $Script.Substring($MethodStart, ($MethodEnd + $MethodEndString.Length) - $MethodStart)

$OldMethod = $Method
$Method = $Method -Replace '(findpropstrict\s+QName\(PackageNamespace\("alternativa\.startup"\),"ConnectionParameters"\)\r?\n\s*)pushstring\s+".+"()', "`${1}
getlocal1
getproperty         QName(PackageNamespace(`"`"),`"parameters`")
pushstring          `"ip`"
getproperty         MultinameL([PrivateNamespace(`"Game`"),PackageNamespace(`"`"),PackageInternalNs(`"`"),Namespace(`"http://adobe.com/AS3/2006/builtin`"),ProtectedNamespace(`"Game`"),StaticProtectedNs(`"Game`"),StaticProtectedNs(`"flash.display:Sprite`"),StaticProtectedNs(`"flash.display:DisplayObjectContainer`"),StaticProtectedNs(`"flash.display:InteractiveObject`"),StaticProtectedNs(`"flash.display:DisplayObject`"),StaticProtectedNs(`"flash.events:EventDispatcher`")]) ; changed
`${2}"
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to change game server address to <prelauncher>"
} else {
  Write-Output ">>> Changed game server address to <prelauncher>"
}

$OldMethod = $Method
$Method = $Method -Replace '(getglobalscope\r?\n\s*)pushshort\s+\d+()', "`${1}
getlocal1
getproperty         QName(PackageNamespace(`"`"),`"parameters`")
pushstring          `"port`"
getproperty         MultinameL([PrivateNamespace(`"Game`"),PackageNamespace(`"`"),PackageInternalNs(`"`"),Namespace(`"http://adobe.com/AS3/2006/builtin`"),ProtectedNamespace(`"Game`"),StaticProtectedNs(`"Game`"),StaticProtectedNs(`"flash.display:Sprite`"),StaticProtectedNs(`"flash.display:DisplayObjectContainer`"),StaticProtectedNs(`"flash.display:InteractiveObject`"),StaticProtectedNs(`"flash.display:DisplayObject`"),StaticProtectedNs(`"flash.events:EventDispatcher`")]) ; changed
`${2}"
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to change game server port to <prelauncher>"
} else {
  Write-Output ">>> Changed game server port to <prelauncher>"
}

$OldMethod = $Method
$Method = $Method -Replace '(call\s+1\r?\n\s*pushnull\r?\n\s*)pushstring\s+".+"()', "`${1}
getlocal1
getproperty         QName(PackageNamespace(`"`"),`"parameters`")
pushstring          `"resources`"
getproperty         MultinameL([PrivateNamespace(`"Game`"),PackageNamespace(`"`"),PackageInternalNs(`"`"),Namespace(`"http://adobe.com/AS3/2006/builtin`"),ProtectedNamespace(`"Game`"),StaticProtectedNs(`"Game`"),StaticProtectedNs(`"flash.display:Sprite`"),StaticProtectedNs(`"flash.display:DisplayObjectContainer`"),StaticProtectedNs(`"flash.display:InteractiveObject`"),StaticProtectedNs(`"flash.display:DisplayObject`"),StaticProtectedNs(`"flash.events:EventDispatcher`")]) ; changed
`${2}"
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to change resource server URL to <prelauncher>"
} else {
  Write-Output ">>> Changed resource server URL to <prelauncher>"
}

Set-Content -Path $ScriptLocation $Method
# Write-Output $Method

Write-Output ">>> Patching SWF file..."
java -jar $FFDec -replace $InputFile $OutputFile Game $ScriptLocation 1

Write-Output ">>> Removing temporary directory..."
Remove-Item -Recurse -Force $TemporaryDirectory

Write-Output ">>> Done! Output file: $OutputFile"
