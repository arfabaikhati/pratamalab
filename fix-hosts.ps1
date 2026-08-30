$hostsFile = "C:\Windows\System32\drivers\etc\hosts"
$lines = Get-Content $hostsFile

# Perbaiki baris yang tergabung (workspace.test127... jadi dua baris)
$fixed = @()
foreach ($line in $lines) {
    if ($line -match "workspace\.test127\.0\.0\.1\s+pratamalab\.test(.*)") {
        $fixed += "127.0.0.1      workspace.test"
        $fixed += "127.0.0.1      pratamalab.test          #laragon magic!"
    } else {
        $fixed += $line
    }
}

# Kalau pratamalab.test belum ada sama sekali, tambahkan
$hasPratamalab = $fixed | Where-Object { $_ -match "^\s*127\.0\.0\.1\s+pratamalab\.test\s*$|^\s*127\.0\.0\.1\s+pratamalab\.test\s+#" }
if (-not $hasPratamalab) {
    $fixed += "127.0.0.1      pratamalab.test          #laragon magic!"
}

Set-Content -Path $hostsFile -Value $fixed -Encoding ASCII
Write-Host "Hosts file fixed!"
Get-Content $hostsFile | Select-String "pratamalab"
