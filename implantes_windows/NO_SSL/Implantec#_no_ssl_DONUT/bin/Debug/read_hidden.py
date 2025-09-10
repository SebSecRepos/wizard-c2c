def agregar_texto_al_final(ruta_ejecutable):

    # Abrimos el archivo en modo binario y append (añadir al final)

    with open(ruta_ejecutable, 'rb') as f:
        data=f.read()
        print(data.decode('utf-16-le', errors='ignore'))
    

# Ejemplo de uso
ruta = '.\\Implante.exe'

agregar_texto_al_final(ruta)
