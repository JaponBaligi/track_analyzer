param(
    [Parameter(Mandatory=$true)]
    [string]$ArtifactPath,

    [Parameter(Mandatory=$false)]
    [string]$DeployPath = "C:\opt\track_analyzer",

    [Parameter(Mandatory=$false)]
    [string]$ServiceAccount = "tracksvc"
)

function Ensure-ServiceAccount {
    param($name)

    $existing = Get-LocalUser -Name $name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Service account $name already exists."
        return $existing
    }

    # Generate a random strong password
    Add-Type -AssemblyName System.Web
    $pwdPlain = [System.Web.Security.Membership]::GeneratePassword(24,6)
    $securePwd = ConvertTo-SecureString $pwdPlain -AsPlainText -Force

    Write-Host "Creating local service account: $name"
    New-LocalUser -Name $name -Password $securePwd -NoPasswordExpiration -AccountNeverExpires -UserMayNotChangePassword
    # store password securely: manual step required. This script prints it (so copy it to your secret store).
    Write-Host "SERVICE ACCOUNT CREDENTIALS (copy to secure vault):"
    Write-Host "Username: $env:COMPUTERNAME\$name"
    Write-Host "Password: $pwdPlain"
    return Get-LocalUser -Name $name
}

function Set-DeployACLs {
    param($path, $svcAccount)

    # remove inheritance
    icacls $path /inheritance:r | Out-Null
    # grant full control to SYSTEM
    icacls $path /grant "SYSTEM:(OI)(CI)F" | Out-Null
    # grant read&execute to the svc account
    $machine = $env:COMPUTERNAME
    icacls $path /grant "$machine\$svcAccount:(OI)(CI)(RX)" | Out-Null
    # optionally restrict Administrators (commented out — apply with caution)
    # icacls $path /remove "BUILTIN\Administrators" | Out-Null
    Write-Host "Applied ACLs to $path"
    icacls $path
}

# Begin
if (-Not (Test-Path $ArtifactPath)) {
    throw "ArtifactPath '$ArtifactPath' does not exist. Copy your CI artifacts to the VDS first."
}

# Create deploy directory
if (Test-Path $DeployPath) {
    Write-Host "Removing existing deploy directory (backup first if needed): $DeployPath"
    Remove-Item -Recurse -Force $DeployPath
}
New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null

# Copy artifacts
Write-Host "Copying artifacts from $ArtifactPath to $DeployPath..."
Copy-Item -Path (Join-Path $ArtifactPath "*") -Destination $DeployPath -Recurse -Force

# Set ACLs
Set-DeployACLs -path $DeployPath -svcAccount $ServiceAccount

# Ensure service account exists
Ensure-ServiceAccount -name $ServiceAccount

# Identify backend exe: try to find a single exe under backend artifact dir
$backendExe = Get-ChildItem -Path (Join-Path $DeployPath "backend") -Filter *.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if (-Not $backendExe) {
    # fallback: any exe in deploy root
    $backendExe = Get-ChildItem -Path $DeployPath -Filter *.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
}

if (-Not $backendExe) {
    throw "No backend exe found in $DeployPath. Ensure your CI produced an exe (Nuitka)."
}

Write-Host "Found backend exe: $($backendExe.FullName)"

$svcName = "TrackAnalyzer"
$svcDisplay = "Track Analyzer Service"
$svcUser = "$env:COMPUTERNAME\$ServiceAccount"

# Try to install service using NSSM if present
$nssmPath = "C:\tools\nssm\nssm.exe"
if (Test-Path $nssmPath) {
    Write-Host "Installing service with NSSM..."
    & $nssmPath install $svcName $backendExe.FullName
    & $nssmPath set $svcName AppDirectory (Split-Path $backendExe.FullName)
    & $nssmPath set $svcName ObjectName $svcUser
    # NSSM stores password interactively; you may need to set credentials via UI or use sc.exe method below.
    & $nssmPath start $svcName
    Write-Host "Service installed and started with NSSM."
} else {
    Write-Host "NSSM not found. Attempting sc.exe create (requires plaintext password)."
    # Attempt to get the password from the created local user (not possible programmatically here).
    Write-Host "You must supply the service account password to register as a service using sc.exe."
    $svcPwd = Read-Host -AsSecureString -Prompt "Enter the service account password for $svcUser"
    $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($svcPwd))
    $binPathQuoted = "`"$($backendExe.FullName)`""
    $cmd = "sc.exe create $svcName binPath= $binPathQuoted DisplayName= `"$svcDisplay`" start= auto obj= `"$svcUser`" password= `"$plain`""
    Write-Host "Running: $cmd"
    Invoke-Expression $cmd
    Start-Service $svcName
    Write-Host "Service created and started with sc.exe"
}

Write-Host "Deployment finished. Verify service is running: Get-Service -Name $svcName"
