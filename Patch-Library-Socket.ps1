param(
  [Parameter(Mandatory=$true)] [string] $InputFile,
  [Parameter(Mandatory=$true)] [string] $OutputFile,
  [string] $FFDec = 'C:\Program Files (x86)\FFDec\ffdec.jar',
  [string] $GameServer,
  [string] $ResourceServer
)

function New-TemporaryDirectory {
  $parent = [System.IO.Path]::GetTempPath()
  [string] $name = [System.Guid]::NewGuid()
  New-Item -ItemType Directory -Path (Join-Path $parent $name)
}

Write-Output ">>> Patching $InputFile -> $OutputFile"

if($PSBoundParameters.ContainsKey('GameServer')) {
  $GameServerAddress, $GameServerPort = $GameServer.Split(':')
  if($null -Eq $GameServerPort -Or $null -Eq $GameServerPort) {
    Write-Error ">>> Invalid game server endpoint: $GameServer"
    return
  }

  Write-Output ">>> Game server: ${GameServerAddress}:${GameServerPort}"
}

if($PSBoundParameters.ContainsKey('ResourceServer')) {
  Write-Output ">>> Resource server: $ResourceServer"
}

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

if($PSBoundParameters.ContainsKey('GameServer')) {
  $OldMethod = $Method
  $Method = $Method -Replace '(findpropstrict\s+QName\(PackageNamespace\("alternativa\.startup"\),"ConnectionParameters"\)\r?\n\s*)pushstring\s+".+"()', "`${1}pushstring `"$GameServerAddress`" ; changed`${2}"
  if($Method -Ceq $OldMethod) {
    Write-Error ">>> Failed to change game server address to $GameServerAddress"
  } else {
    Write-Output ">>> Changed game server address to $GameServerAddress"
  }

  $OldMethod = $Method
  $Method = $Method -Replace '(getglobalscope\r?\n\s*)pushshort\s+\d+()', "`${1}pushint $GameServerPort ; changed`${2}"
  if($Method -Ceq $OldMethod) {
    Write-Error ">>> Failed to change game server port to $GameServerPort"
  } else {
    Write-Output ">>> Changed game server port to $GameServerPort"
  }
}

if($PSBoundParameters.ContainsKey('ResourceServer')) {
  $OldMethod = $Method
  $Method = $Method -Replace '(call\s+1\r?\n\s*pushnull\r?\n\s*)pushstring\s+".+"()', "`${1}pushstring `"$ResourceServer`" ; changed`${2}"
  if($Method -Ceq $OldMethod) {
    Write-Error ">>> Failed to change resource server URL to $ResourceServer"
  } else {
    Write-Output ">>> Changed resource server URL to $ResourceServer"
  }
}

Set-Content -Path $ScriptLocation $Method
# Write-Output $Method

Write-Output ">>> Patching SWF file..."
java -jar $FFDec -replace $InputFile $OutputFile Game $ScriptLocation 1

Write-Output ">>> Removing temporary directory..."
Remove-Item -Recurse -Force $TemporaryDirectory

Write-Output ">>> Done! Output file: $OutputFile"
