# ProTanki Utilities

A bunch of utilities for ProTanki.

## [packet-log.patch.txt](packet-log.patch.txt)

Patch (manual applying via [JPEXS Free Flash Decompiler](https://github.com/jindrapetrik/jpexs-decompiler)) to log incoming and outgoing game packets.  
Log file is located at `$Desktop/packets.txt`.

## [packet2map.js](packet2map.js)

Converts battle join packets to the server map file (`data/maps/$name/$theme.json`).

Input format:
```json
{"resources":[...]}
{"resources":[...]}
{"resources":[...]}
{"kick_period_ms":125000,"map_id":...}
```

Alternative input format:
```json
[...]
[...]
[...]
{"kick_period_ms":125000,"map_id":...}
```

Example usage (PowerShell):
```powershell
Get-Content battle.txt | node ./packet2map.js | Set-Content map.json
```

## [strip-packets.js](strip-packets.js)

Extracts resource and battle model init packets from dump.

Example usage (PowerShell):
```powershell
Get-Content battle.txt | node ./strip-packets.js | node ./packet2map.js | Set-Content map.json
```
