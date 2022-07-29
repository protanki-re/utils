param(
  [Parameter(Mandatory=$true)] [string] $Items
)

foreach($group in Get-ChildItem($Items)) {
  foreach($item in Get-ChildItem($group) | where { $_.Extension -Eq '.json' }) {
    Write-Output "Processing ${item}..."
    & $node ./garage-sync-indexes.js $item
  }
}
