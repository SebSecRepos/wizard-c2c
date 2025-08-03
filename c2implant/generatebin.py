import pefile

pe = pefile.PE(".\implant.exe")
text_section = next(section for section in pe.sections if section.Name.decode().strip('\x00') == '.text')
shellcode = text_section.get_data()

with open("shellcode.bin", "wb") as f:
    f.write(shellcode)

print("Shellcode generado en shellcode.bin")