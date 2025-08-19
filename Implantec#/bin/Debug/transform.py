import sys
import re
import socket


#\x37\x2e\x30\x2e\x30\x2e\x31
#pattern = socket.inet_aton("127.0.0.1")
default_ip = '127.0.0.1'.encode('utf-16-le')
new_ip = 'localhost'.encode('utf-16-le')
default_port = '4000'.encode('utf-16-le')
new_port = '443'.encode('utf-16-le')

""" if len(default_ip) != len(new_ip):
    print("Len diff")
    sys.exit(1) """


with open('Implante.exe', 'rb') as file: 
    bin = file.read()


replacement = bin.replace(default_ip, new_ip).replace(default_port,new_port)

with open('Implante2.exe', 'wb') as file_out: 
    file_out.write(replacement)


    