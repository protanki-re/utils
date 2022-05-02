param(
  [Parameter(Mandatory=$true)] [string] $InputFile,
  [Parameter(Mandatory=$true)] [string] $OutputFile,
  [string] $FFDec = 'C:\Program Files (x86)\FFDec\ffdec.jar',
  [string] $ConfigFile = 'socket.cfg'
)

function New-TemporaryDirectory {
  $parent = [System.IO.Path]::GetTempPath()
  [string] $name = [System.Guid]::NewGuid()
  New-Item -ItemType Directory -Path (Join-Path $parent $name)
}

Write-Output ">>> Patching $InputFile -> $OutputFile"

$TemporaryDirectory = New-TemporaryDirectory
Write-Output ">>> Temporary directory: $TemporaryDirectory"

java -jar $FFDec -selectclass protanki.launcher.Prelauncher -format script:pcode -export script $TemporaryDirectory $InputFile

$ScriptLocation = Join-Path $TemporaryDirectory 'scripts/protanki/launcher/Prelauncher.pcode'
$ScriptConstructorLocation = Join-Path $TemporaryDirectory 'scripts/protanki/launcher/Prelauncher.constructor.pcode'
$ScriptListenerLocation = Join-Path $TemporaryDirectory 'scripts/protanki/launcher/Prelauncher.listener.pcode'

$SwfIntermediateLocation = Join-Path $TemporaryDirectory 'intermediate.swf'

$Script = Get-Content $ScriptLocation -Raw

# Constructor
$MethodStartString = 'public function Prelauncher()'
$MethodEndString = 'end ; method'

$MethodStart = $Script.IndexOf('{', $Script.IndexOf($MethodStartString)) + 1
$MethodEnd = $Script.IndexOf($MethodEndString, $MethodStart)

$Method = $Script.Substring($MethodStart, ($MethodEnd + $MethodEndString.Length) - $MethodStart)

$OldMethod = $Method
$Method = $Method -Replace '()pushstring\s+".+"(\r?\n\s*coerce_a\r?\n\s*ofs[0-9a-f]+:\r?\n\s*findproperty\s+QName\(PrivateNamespace\("protanki\.launcher:Prelauncher"\),"socketUrl"\)\r?\n\s*swap\r?\n\s*setproperty\s+QName\(PrivateNamespace\("protanki\.launcher:Prelauncher"\),"socketUrl"\))', "`${1}pushstring `"$ConfigFile`"; changed`${2}"
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to change configuration file to $ConfigFile"
} else {
  Write-Output ">>> Changed configuration file to $ConfigFile"
}

Set-Content -Path $ScriptConstructorLocation $Method
# Write-Output $Method

Write-Output ">>> Patching SWF file (constructor)..."
java -jar $FFDec -replace $InputFile $SwfIntermediateLocation protanki.launcher.Prelauncher $ScriptConstructorLocation 20

# Listener
$MethodStartString = 'trait method QName(PrivateNamespace("protanki.launcher:Prelauncher"),"onSocketLoadingComplete")'
$MethodEndString = 'end ; method'

$MethodStart = $Script.IndexOf($MethodStartString)
$MethodEnd = $Script.IndexOf($MethodEndString, $MethodStart)

$Method = $Script.Substring($MethodStart, ($MethodEnd + $MethodEndString.Length) - $MethodStart)

$OldMethod = $Method
$Method = $Method -Replace '(setlocal\s+4\r?\n\s*)()', "`${1}
; Loader
findproperty        QName(PrivateNamespace(`"protanki.launcher:Prelauncher`"),`"swf`")
getlocal            4
getproperty         Multiname(`"loader`",[PrivateNamespace(`"protanki.launcher:Prelauncher`"),ProtectedNamespace(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"flash.display:Sprite`"),StaticProtectedNs(`"flash.display:DisplayObjectContainer`"),StaticProtectedNs(`"flash.display:InteractiveObject`"),StaticProtectedNs(`"flash.display:DisplayObject`"),StaticProtectedNs(`"flash.events:EventDispatcher`"),StaticProtectedNs(`"Object`"),PackageNamespace(`"protanki.launcher`"),PackageInternalNs(`"protanki.launcher`"),PrivateNamespace(`"FilePrivateNS:Prelauncher`"),PackageNamespace(`"`"),Namespace(`"http://adobe.com/AS3/2006/builtin`")])
convert_s
setproperty         QName(PrivateNamespace(`"protanki.launcher:Prelauncher`"),`"swf`")

; Library
getlex              QName(PrivateNamespace(`"protanki.launcher:Prelauncher`"),`"airParameters`")
pushstring          `"swf`"
getlocal            4
getproperty         Multiname(`"library`",[PrivateNamespace(`"protanki.launcher:Prelauncher`"),ProtectedNamespace(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"flash.display:Sprite`"),StaticProtectedNs(`"flash.display:DisplayObjectContainer`"),StaticProtectedNs(`"flash.display:InteractiveObject`"),StaticProtectedNs(`"flash.display:DisplayObject`"),StaticProtectedNs(`"flash.events:EventDispatcher`"),StaticProtectedNs(`"Object`"),PackageNamespace(`"protanki.launcher`"),PackageInternalNs(`"protanki.launcher`"),PrivateNamespace(`"FilePrivateNS:Prelauncher`"),PackageNamespace(`"`"),Namespace(`"http://adobe.com/AS3/2006/builtin`")])
convert_s
setproperty         MultinameL([PrivateNamespace(`"protanki.launcher:Prelauncher`"),ProtectedNamespace(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"flash.display:Sprite`"),StaticProtectedNs(`"flash.display:DisplayObjectContainer`"),StaticProtectedNs(`"flash.display:InteractiveObject`"),StaticProtectedNs(`"flash.display:DisplayObject`"),StaticProtectedNs(`"flash.events:EventDispatcher`"),StaticProtectedNs(`"Object`"),PackageNamespace(`"protanki.launcher`"),PackageInternalNs(`"protanki.launcher`"),PrivateNamespace(`"FilePrivateNS:Prelauncher`"),PackageNamespace(`"`"),Namespace(`"http://adobe.com/AS3/2006/builtin`")])

; Resources
getlex              QName(PrivateNamespace(`"protanki.launcher:Prelauncher`"),`"airParameters`")
pushstring          `"resources`"
getlocal            4
getproperty         Multiname(`"resources`",[PrivateNamespace(`"protanki.launcher:Prelauncher`"),ProtectedNamespace(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"flash.display:Sprite`"),StaticProtectedNs(`"flash.display:DisplayObjectContainer`"),StaticProtectedNs(`"flash.display:InteractiveObject`"),StaticProtectedNs(`"flash.display:DisplayObject`"),StaticProtectedNs(`"flash.events:EventDispatcher`"),StaticProtectedNs(`"Object`"),PackageNamespace(`"protanki.launcher`"),PackageInternalNs(`"protanki.launcher`"),PrivateNamespace(`"FilePrivateNS:Prelauncher`"),PackageNamespace(`"`"),Namespace(`"http://adobe.com/AS3/2006/builtin`")])
convert_s
setproperty         MultinameL([PrivateNamespace(`"protanki.launcher:Prelauncher`"),ProtectedNamespace(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"protanki.launcher:Prelauncher`"),StaticProtectedNs(`"flash.display:Sprite`"),StaticProtectedNs(`"flash.display:DisplayObjectContainer`"),StaticProtectedNs(`"flash.display:InteractiveObject`"),StaticProtectedNs(`"flash.display:DisplayObject`"),StaticProtectedNs(`"flash.events:EventDispatcher`"),StaticProtectedNs(`"Object`"),PackageNamespace(`"protanki.launcher`"),PackageInternalNs(`"protanki.launcher`"),PrivateNamespace(`"FilePrivateNS:Prelauncher`"),PackageNamespace(`"`"),Namespace(`"http://adobe.com/AS3/2006/builtin`")])
`${2}"
if($Method -Ceq $OldMethod) {
  Write-Error ">>> Failed to inject override"
} else {
  Write-Output ">>> Injected override"
}

Set-Content -Path $ScriptListenerLocation $Method
# Write-Output $Method

Write-Output ">>> Patching SWF file (listener)..."
java -jar $FFDec -replace $SwfIntermediateLocation $OutputFile protanki.launcher.Prelauncher $ScriptListenerLocation 8

Write-Output ">>> Removing temporary directory..."
Remove-Item -Recurse -Force $TemporaryDirectory

Write-Output ">>> Done! Output file: $OutputFile"
