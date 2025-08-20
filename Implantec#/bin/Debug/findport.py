import re

default_port = '127.0.0.1:4000'.encode('utf-16-le')


with open('Implante.exe', 'rb') as file: 
    bin = file.read()
    matches = re.findall(default_port, bin)

print(len(matches))


    