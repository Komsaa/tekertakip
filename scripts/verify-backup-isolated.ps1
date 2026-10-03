$ErrorActionPreference = 'Stop'
# Deliberately restricted to the disposable local test cluster. Never loads .env.
$pgBin = 'C:/Program Files/PostgreSQL/17/bin'
$testBackupDir = Join-Path ([IO.Path]::GetTempPath()) ('tekertakip-backup-check-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testBackupDir | Out-Null
$testBackupPath = Join-Path $testBackupDir 'test.dump'
$testRestoreDb = 'tt_restore_' + [guid]::NewGuid().ToString('N')
$connectionArgs = @('-h', '127.0.0.1', '-p', '55439', '-U', 'tt_test', '--no-password')
& "$pgBin/pg_dump.exe" @connectionArgs -d tekertakip_e2e -Fc -f $testBackupPath
if ($LASTEXITCODE -ne 0) { throw 'Test backup failed' }
& "$pgBin/createdb.exe" @connectionArgs $testRestoreDb
if ($LASTEXITCODE -ne 0) { throw 'Isolated restore database creation failed' }
& "$pgBin/pg_restore.exe" @connectionArgs -d $testRestoreDb --exit-on-error --no-owner --no-privileges $testBackupPath
if ($LASTEXITCODE -ne 0) { throw 'Test restore failed' }
$countQuery = 'SELECT (SELECT count(*) FROM "Company"), (SELECT count(*) FROM "Driver"), (SELECT count(*) FROM "DemoRequest");'
$originalCounts = $countQuery | & "$pgBin/psql.exe" @connectionArgs -d tekertakip_e2e -v ON_ERROR_STOP=1 -t -A
if ($LASTEXITCODE -ne 0) { throw 'Source validation failed' }
$restoredCounts = $countQuery | & "$pgBin/psql.exe" @connectionArgs -d $testRestoreDb -v ON_ERROR_STOP=1 -t -A
if ($LASTEXITCODE -ne 0 -or "$originalCounts" -ne "$restoredCounts") { throw 'Restore count mismatch' }
Write-Output "PASS backup restored; Company/Driver/DemoRequest counts match: $restoredCounts"
Write-Output "Synthetic backup retained: $testBackupPath"
Write-Output "Isolated restore database retained: $testRestoreDb"
