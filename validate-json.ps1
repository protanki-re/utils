param(
  [Parameter(Mandatory=$true)] [string] $Maps
)

foreach($map in Get-ChildItem($Maps)) {
  foreach($theme in Get-ChildItem($map) | where { $_.Extension -Eq '.json' }) {
    Write-Output "Validating ${theme}..."
    
    try {
      $json = Get-Content $theme | ConvertFrom-Json
    } catch {
      Write-Output "Error parsing ${theme}..."
      Write-Output $_
      return
    }
  }
}
