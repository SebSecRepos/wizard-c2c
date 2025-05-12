import asyncio
from websockets import connect
import json
import subprocess


def cmo(cmd):
    result=subprocess.run(f"{cmd}", capture_output=True, text=True)
    return result.stdout.replace(" ","").replace("\n","").replace("\r","")

async def recibe():

    uri = "ws://localhost:4000/api/rcv?id=1"
    async with connect(uri) as ws:
        while True:
            cmd = await ws.recv()
            if cmd and cmd != "undefined":
                try:
                    print(f" {cmd}")
                    data = json.loads(cmd.replace("'", '"'))
                    res = cmo(data["cmd"])
                    print(f"> {res}")
                    await ws.send(res)
                except json.JSONDecodeError as e:
                    print(f"JSON inválido: {e}")
                except Exception as e:
                    print(f"Error procesando el comando: {e}")

            

asyncio.run( recibe() )