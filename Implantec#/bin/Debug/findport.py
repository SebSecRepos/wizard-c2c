import sys
import re
import socket
import struct

#\x37\x2e\x30\x2e\x30\x2e\x31
#pattern = socket.inet_aton("127.0.0.1")
default_port = 4000.encode('utf-16-le')
#puerto = struct.pack('<H', default_port)


with open('Implante.exe', 'rb') as file: 
    bin = file.read()
    matches = re.findall(default_port, bin)

print(matches)


    